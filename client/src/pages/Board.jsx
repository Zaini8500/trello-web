import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Column from '../components/Board/Column';
import {
    DndContext,
    closestCorners,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import TaskCard from '../components/Board/TaskCard';

export default function Board() {
    const { id } = useParams();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]); // Local state for immediate UI updates
    const [newListTitle, setNewListTitle] = useState("");
    const [activeCard, setActiveCard] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    useEffect(() => {
        fetchBoard();
    }, [id]);

    const fetchBoard = async () => {
        try {
            const { data } = await api.get(`/boards/${id}`);
            setBoard(data);
            setLists(data.lists);
        } catch (err) {
            console.error(err);
        }
    };

    const addList = async (e) => {
        e.preventDefault();
        if (!newListTitle) return;
        try {
            const { data } = await api.post(`/boards/${id}/lists`, { title: newListTitle });
            setLists([...lists, { ...data, cards: [] }]);
            setNewListTitle("");
        } catch (err) {
            console.error(err);
        }
    };

    const deleteList = async (listId) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/boards/${id}/lists/${listId}`);
            setLists(lists.filter(l => l.id !== listId));
        } catch (err) {
            console.error(err);
        }
    }

    const addCard = async (listId, title) => {
        try {
            const { data } = await api.post(`/boards/${id}/lists/${listId}/cards`, { title, order: 0 });
            // Update local state
            const newLists = lists.map(list => {
                if (list.id === listId) {
                    return { ...list, cards: [...list.cards, data] };
                }
                return list;
            });
            setLists(newLists);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteCard = async (cardId) => {
        try {
            await api.delete(`/boards/${id}/cards/${cardId}`);
            const newLists = lists.map(list => {
                return { ...list, cards: list.cards.filter(c => c.id !== cardId) };
            });
            setLists(newLists);
        } catch (err) {
            console.error(err);
        }
    }

    const handleDragStart = (event) => {
        const { active } = event;
        const cardId = active.id;
        // Find card
        let foundCard = null;
        for (const list of lists) {
            const c = list.cards.find(c => c.id === cardId);
            if (c) {
                foundCard = c;
                break;
            }
        }
        setActiveCard(foundCard);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find containers
        const findContainer = (id) => {
            const list = lists.find(l => l.id === id);
            if (list) return list.id;
            const listWithCard = lists.find(l => l.cards.some(c => c.id === id));
            return listWithCard ? listWithCard.id : null;
        };

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Move to another list visualy during drag
        setLists((prev) => {
            const activeListIndex = prev.findIndex(l => l.id === activeContainer);
            const overListIndex = prev.findIndex(l => l.id === overContainer);

            const newLists = [...prev];
            const activeList = { ...newLists[activeListIndex] };
            const overList = { ...newLists[overListIndex] };

            // Remove from active
            const cardIndex = activeList.cards.findIndex(c => c.id === activeId);
            const [movedCard] = activeList.cards.splice(cardIndex, 1);

            // Add to over
            // If over matches a card id, insert near it. If it matches list id, push to end.
            const isOverList = over.data.current?.type !== 'Card';
            if (isOverList) {
                overList.cards.push(movedCard);
            } else {
                // Find index of over card
                const overCardIndex = overList.cards.findIndex(c => c.id === overId);
                const isBelowOverItem = over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                const newIndex = overCardIndex >= 0 ? overCardIndex + modifier : overList.cards.length + 1;
                overList.cards.splice(newIndex, 0, movedCard);
            }

            newLists[activeListIndex] = activeList;
            newLists[overListIndex] = overList;

            return newLists;
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveCard(null);

        // If dropped nowhere
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Persist change
        // We need to identify the new list and new index
        // We can rely on the `lists` state which DragOver kept updated mostly? 
        // Actually DragOver updates are transient if we don't save. 
        // But `setLists` updates stat, so we just need to send API call

        // Find the card in the *current* state (post-drag-over)
        let finalListId = null;
        let finalOrder = 0;

        // Scan lists to find where the card ended up
        // Wait, DragOver handles "between lists".
        // DragEnd handles "within same list" reordering if not covered.

        // Re-scanning lists
        // Note: This needs robust logic. For MVP speed, let's just find the card's new parent and neighbors.

        // Ideally we use arrayMove for same container
        // And move logic for different container

        // Let's simplified: just trigger API update based on final state
        // But we need to know what the final state IS from the `lists` object, because `handleDragOver` mutated it?
        // standard dnd-kit `handleDragOver` updates state.
        // So `lists` IS the source of truth for UI.
        // We just need to sync backend.

        // Find card
        let card = null;
        let listId = null;
        let index = -1;

        lists.forEach(l => {
            const idx = l.cards.findIndex(c => c.id === activeId);
            if (idx !== -1) {
                card = l.cards[idx];
                listId = l.id;
                index = idx;
            }
        });

        if (card && listId) {
            // Calculate naive order
            // In real app, we check neighbors' order
            // items: [ {order: 100}, {order: 200} ]
            // if index 0, order = next.order / 2 or next.order - 100
            // if index last, order = prev.order + 100
            // if middle, (prev + next) / 2

            const targetList = lists.find(l => l.id === listId);
            const cards = targetList.cards;
            let newOrder = 0;

            if (cards.length === 1) {
                newOrder = 100;
            } else if (index === 0) {
                newOrder = cards[1].order / 2;
            } else if (index === cards.length - 1) {
                newOrder = cards[index - 1].order + 100;
            } else {
                const prev = cards[index - 1].order;
                const next = cards[index + 1].order;
                newOrder = (prev + next) / 2;
            }

            // Optimistic update
            // We already have UI update.
            // Send API
            await api.put(`/boards/${id}/cards/${activeId}`, {
                listId,
                order: newOrder
            });
        }
    };

    if (!board) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div
                className="h-screen flex flex-col bg-blue-500"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80)', backgroundSize: 'cover' }}
            >
                {/* Header */}
                <div className="bg-black/30 backdrop-blur-sm p-4 text-white flex justify-between items-center shadow">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="hover:bg-white/20 p-2 rounded"><ArrowLeft size={20} /></Link>
                        <h1 className="font-bold text-lg">{board.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        {/* Invite Button could go here */}
                        <div className="flex -space-x-2">
                            {board.members.map(m => (
                                <div key={m.id} className="w-8 h-8 rounded-full bg-white text-blue-800 flex items-center justify-center font-bold text-xs border-2 border-transparent" title={m.name}>
                                    {m.name.charAt(0)}
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs border-2 border-white" title="Owner">
                                {board.owner.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Board Canvas */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="flex gap-4 h-full items-start">

                        {lists.map(list => (
                            <Column
                                key={list.id}
                                list={list}
                                cards={list.cards}
                                onDeleteList={deleteList}
                                onAddCard={addCard}
                                onDeleteCard={deleteCard}
                            />
                        ))}

                        {/* Add List Button */}
                        <div className="w-72 flex-shrink-0">
                            <form onSubmit={addList} className="bg-white/20 backdrop-blur-md p-3 rounded-lg hover:bg-white/30 transition">
                                <input
                                    className="w-full p-2 text-sm rounded border-none focus:ring-2 ring-blue-500 bg-white/90"
                                    placeholder="+ Add another list"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                />
                                {newListTitle && <button className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm w-full">Add List</button>}
                            </form>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeCard ? <TaskCard card={activeCard} /> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
