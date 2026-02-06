const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Helper function to create audit log
const createAuditLog = async (action, entityType, entityId, userId, boardId, metadata = {}) => {
    try {
        await AuditLog.create({
            action,
            entityType,
            entityId,
            user: userId,
            board: boardId,
            metadata
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

// Get all boards for user
router.get('/', protect, async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        }).populate('owner', 'name email');

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

        await createAuditLog('create', 'Board', board._id, req.user.id, board._id, { title });

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

        const isMember = board.members.some(m => m._id.toString() === req.user.id);
        const isOwner = board.owner._id.toString() === req.user.id;
        if (!isMember && !isOwner) return res.status(403).json({ message: 'Not authorized' });

        const transformCard = (c) => ({
            id: c._id,
            title: c.title,
            description: c.description,
            order: c.order,
            listId: c.list,
            labels: c.labels || [],
            dueDate: c.dueDate
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

        await Board.findByIdAndUpdate(boardId, { $push: { lists: list._id } });
        await createAuditLog('create', 'List', list._id, req.user.id, boardId, { title });

        res.json({ id: list._id, title: list.title, order: list.order, boardId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reorder Lists
router.put('/:id/lists/reorder', protect, async (req, res) => {
    const { listOrders } = req.body; // Array of { listId, order }
    const boardId = req.params.id;

    try {
        const updatePromises = listOrders.map(({ listId, order }) =>
            List.findByIdAndUpdate(listId, { order }, { new: true })
        );

        await Promise.all(updatePromises);
        await createAuditLog('update', 'List', 'multiple', req.user.id, boardId, { action: 'reorder' });

        res.json({ message: 'Lists reordered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Card
router.post('/:id/lists/:listId/cards', protect, async (req, res) => {
    const { title, description, labels, dueDate } = req.body;
    const { listId } = req.params;
    const boardId = req.params.id;

    try {
        const lastCard = await Card.findOne({ list: listId }).sort('-order');
        const newOrder = lastCard ? lastCard.order + 100 : 100;

        const card = await Card.create({
            title,
            description,
            list: listId,
            order: newOrder,
            labels: labels || [],
            dueDate: dueDate || null,
            creator: req.user.id
        });

        await List.findByIdAndUpdate(listId, { $push: { cards: card._id } });
        await createAuditLog('create', 'Card', card._id, req.user.id, boardId, { title, listId });

        res.json({
            id: card._id,
            title: card.title,
            description: card.description,
            order: card.order,
            listId: card.list,
            labels: card.labels,
            dueDate: card.dueDate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Card
router.put('/cards/:cardId', protect, async (req, res) => {
    const { listId, order, title, description, labels, dueDate } = req.body;

    try {
        const card = await Card.findById(req.params.cardId);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const oldListId = card.list.toString();
        const updates = {};

        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (order !== undefined) updates.order = order;
        if (labels !== undefined) updates.labels = labels;
        if (dueDate !== undefined) updates.dueDate = dueDate;
        if (listId) updates.list = listId;

        const updatedCard = await Card.findByIdAndUpdate(req.params.cardId, updates, { new: true });

        if (listId && oldListId !== listId) {
            await List.findByIdAndUpdate(oldListId, { $pull: { cards: card._id } });
            await List.findByIdAndUpdate(listId, { $push: { cards: card._id } });

            const list = await List.findById(listId);
            await createAuditLog('move', 'Card', card._id, req.user.id, list.board, {
                from: oldListId,
                to: listId
            });
        } else {
            const list = await List.findById(card.list);
            await createAuditLog('update', 'Card', card._id, req.user.id, list.board, updates);
        }

        res.json({
            id: updatedCard._id,
            title: updatedCard.title,
            description: updatedCard.description,
            order: updatedCard.order,
            listId: updatedCard.list,
            labels: updatedCard.labels,
            dueDate: updatedCard.dueDate
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
            const list = await List.findById(card.list);
            await List.findByIdAndUpdate(card.list, { $pull: { cards: req.params.cardId } });
            await Card.findByIdAndDelete(req.params.cardId);
            await createAuditLog('delete', 'Card', req.params.cardId, req.user.id, list.board, {
                title: card.title
            });
        }
        res.json({ message: 'Card deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Filter cards
router.get('/:id/cards/filter', protect, async (req, res) => {
    const { labels, dueDateFrom, dueDateTo } = req.query;
    const boardId = req.params.id;

    try {
        const board = await Board.findById(boardId).populate('lists');
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const listIds = board.lists.map(l => l._id);

        let query = { list: { $in: listIds } };

        if (labels) {
            const labelArray = labels.split(',');
            query['labels.name'] = { $in: labelArray };
        }

        if (dueDateFrom || dueDateTo) {
            query.dueDate = {};
            if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
            if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
        }

        const cards = await Card.find(query).populate('list').populate('creator');

        res.json(cards.map(c => ({
            id: c._id,
            title: c.title,
            description: c.description,
            labels: c.labels,
            dueDate: c.dueDate,
            listId: c.list._id,
            listName: c.list.title
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Invite Member
router.post('/:id/invite', protect, async (req, res) => {
    const { email } = req.body;
    const boardId = req.params.id;

    try {
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ message: 'User not found' });

        const board = await Board.findByIdAndUpdate(boardId, {
            $addToSet: { members: userToInvite._id }
        }, { new: true }).populate('members', 'name email');

        await createAuditLog('invite', 'Member', userToInvite._id, req.user.id, boardId, {
            email: userToInvite.email
        });

        res.json({ message: 'User invited', members: board.members });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete List
router.delete('/lists/:listId', protect, async (req, res) => {
    try {
        const list = await List.findById(req.params.listId);
        if (list) {
            await Card.deleteMany({ list: req.params.listId });
            await Board.findByIdAndUpdate(list.board, { $pull: { lists: req.params.listId } });
            await List.findByIdAndDelete(req.params.listId);
            await createAuditLog('delete', 'List', req.params.listId, req.user.id, list.board, {
                title: list.title
            });
        }
        res.json({ message: 'List deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get audit logs for a board (paginated)
router.get('/:id/audit-logs', protect, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const boardId = req.params.id;

    try {
        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const isMember = board.members.some(m => m._id.toString() === req.user.id);
        const isOwner = board.owner.toString() === req.user.id;
        if (!isMember && !isOwner) return res.status(403).json({ message: 'Not authorized' });

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const logs = await AuditLog.find({ board: boardId })
            .populate('user', 'name email')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await AuditLog.countDocuments({ board: boardId });

        res.json({
            logs: logs.map(log => ({
                id: log._id,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                user: log.user,
                metadata: log.metadata,
                timestamp: log.timestamp
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
