const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');

// Get all boards for user
router.get('/', protect, async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        }).populate('owner', 'name email');

        // Map _id to id
        const boardsWithId = boards.map(b => ({
            id: b._id,
            title: b.title,
            owner: b.owner,
            createdAt: b.createdAt
        }));

        res.json(boardsWithId);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create board
router.post('/', protect, async (req, res) => {
    const { title } = req.body;
    try {
        const board = await Board.create({
            title,
            owner: req.user.id
        });

        // No explicit audit log for now to save time/complexity, Mongoose doesn't have it built-in like my custom Prisma model loop.
        res.json({ id: board._id, title: board.title, owner: req.user.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single board with lists and cards
router.get('/:id', protect, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate({
                path: 'lists',
                options: { sort: { order: 1 } },
                populate: {
                    path: 'cards',
                    options: { sort: { order: 1 } },
                    model: 'Card',
                    populate: { path: 'creator' }
                }
            })
            .populate('members')
            .populate('owner');

        if (!board) return res.status(404).json({ message: 'Board not found' });

        // Check access
        const isMember = board.members.some(m => m._id.toString() === req.user.id);
        const isOwner = board.owner._id.toString() === req.user.id;
        if (!isMember && !isOwner) return res.status(403).json({ message: 'Not authorized' });

        // Format for frontend
        // We need to map _id to id for the frontend DND to rely on strings if needed?
        // Actually DndKit works with strings or numbers.
        // The previous frontend expects `id` property.

        const transformCard = (c) => ({
            id: c._id,
            title: c.title,
            description: c.description,
            order: c.order,
            listId: c.list
        });

        const transformList = (l) => ({
            id: l._id,
            title: l.title,
            order: l.order,
            boardId: l.board,
            cards: l.cards.map(transformCard)
        });

        res.json({
            id: board._id,
            title: board.title,
            owner: board.owner,
            members: board.members,
            lists: board.lists.map(transformList)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create List
router.post('/:id/lists', protect, async (req, res) => {
    const { title } = req.body;
    const boardId = req.params.id;
    try {
        const lastList = await List.findOne({ board: boardId }).sort('-order');
        const newOrder = lastList ? lastList.order + 100 : 100;

        const list = await List.create({
            title,
            board: boardId,
            order: newOrder
        });

        // Push the list to Board.lists
        await Board.findByIdAndUpdate(boardId, { $push: { lists: list._id } });

        res.json({ id: list._id, title: list.title, order: list.order, boardId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Card
router.post('/:id/lists/:listId/cards', protect, async (req, res) => {
    const { title, description } = req.body;
    const { listId } = req.params;
    try {
        const lastCard = await Card.findOne({ list: listId }).sort('-order');
        const newOrder = lastCard ? lastCard.order + 100 : 100;

        const card = await Card.create({
            title,
            description,
            list: listId,
            order: newOrder,
            creator: req.user.id
        });

        // Push card to List.cards
        await List.findByIdAndUpdate(listId, { $push: { cards: card._id } });

        res.json({
            id: card._id,
            title: card.title,
            order: card.order,
            listId: card.list
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Card (Move, Edit)
router.put('/cards/:cardId', protect, async (req, res) => {
    const { listId, order, title, description } = req.body;

    try {
        const updates = {};
        if (title) updates.title = title;
        if (description) updates.description = description;
        if (order !== undefined) updates.order = order;
        if (listId) updates.list = listId;

        const card = await Card.findByIdAndUpdate(req.params.cardId, updates, { new: true });

        // If moved list, update references
        if (listId) {
            // Removing from old list is hard without knowing old list id.
            // Or we can just use `cards: cardId` pull.
            // Actually efficient way: Pull from all lists (expensive) or just find the one.
            // We can find list which has this card.
            const oldList = await List.findOne({ cards: card._id });
            if (oldList && oldList._id.toString() !== listId) {
                await List.findByIdAndUpdate(oldList._id, { $pull: { cards: card._id } });
                await List.findByIdAndUpdate(listId, { $push: { cards: card._id } });
            }
        }

        res.json({
            id: card._id,
            title: card.title,
            order: card.order,
            listId: card.list
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Card
router.delete('/cards/:cardId', protect, async (req, res) => {
    try {
        const card = await Card.findById(req.params.cardId);
        if (card) {
            await List.findByIdAndUpdate(card.list, { $pull: { cards: req.params.cardId } });
            await Card.findByIdAndDelete(req.params.cardId);
        }
        res.json({ message: 'Card deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Invite Member
router.post('/:id/invite', protect, async (req, res) => {
    const { email } = req.body;
    try {
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ message: 'User not found' });

        await Board.findByIdAndUpdate(req.params.id, {
            $addToSet: { members: userToInvite._id }
        });

        res.json({ message: 'User invited' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete List
router.delete('/lists/:listId', protect, async (req, res) => {
    try {
        const list = await List.findById(req.params.listId);
        if (list) {
            // Delete all cards in list
            await Card.deleteMany({ list: req.params.listId });
            await Board.findByIdAndUpdate(list.board, { $pull: { lists: req.params.listId } });
            await List.findByIdAndDelete(req.params.listId);
        }
        res.json({ message: 'List deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
