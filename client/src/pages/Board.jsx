import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Column from '../components/Board/Column';
import AuditLogView from '../components/Board/AuditLogView';
import InviteMemberModal from '../components/Board/InviteMemberModal';
import CardDetailModal from '../components/Board/CardDetailModal';
import BoardFilter from '../components/Board/BoardFilter';
import {
    DndContext,
    closestCorners,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2, Plus, ArrowLeft, Users, History, Share2 } from 'lucide-react';
import TaskCard from '../components/Board/TaskCard';

export default function Board() {
    const { id } = useParams();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [newListTitle, setNewListTitle] = useState("");
    const [activeCard, setActiveCard] = useState(null);
    const [activeList, setActiveList] = useState(null);

    // UI States
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showLogView, setShowLogView] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [filters, setFilters] = useState({ labels: [], dueDateFrom: '', dueDateTo: '' });
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const fetchBoard = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/boards/${id}`);
            setBoard(data);
            setLists(data.lists);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    // Combined local filtering for responsive UI
    const filteredLists = useMemo(() => {
        const hasLabelFilter = filters.labels?.length > 0;
        const hasDateFromFilter = !!filters.dueDateFrom;
        const hasDateToFilter = !!filters.dueDateTo;

        if (!hasLabelFilter && !hasDateFromFilter && !hasDateToFilter) return lists;

        return lists.map(list => ({
            ...list,
            cards: list.cards.filter(card => {
                let matches = true;
                if (hasLabelFilter) {
                    matches = card.labels?.some(l => filters.labels.includes(l.name));
                }
                if (matches && hasDateFromFilter) {
                    matches = card.dueDate && new Date(card.dueDate) >= new Date(filters.dueDateFrom);
                }
                if (matches && hasDateToFilter) {
                    matches = card.dueDate && new Date(card.dueDate) <= new Date(filters.dueDateTo);
                }
                return matches;
            })
        }));
    }, [lists, filters]);

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
        if (!confirm("Are you sure you want to delete this list and all its cards?")) return;
        try {
            await api.delete(`/boards/lists/${listId}`);
            setLists(lists.filter(l => l.id !== listId));
        } catch (err) {
            console.error(err);
        }
    }

    const addCard = async (listId, title) => {
        try {
            const { data } = await api.post(`/boards/${id}/lists/${listId}/cards`, { title });
            setLists(prev => prev.map(l => l.id === listId ? { ...l, cards: [...l.cards, data] } : l));
        } catch (err) {
            console.error(err);
        }
    };

    const updateCard = async (updatedCard) => {
        setLists(prev => prev.map(l => ({
            ...l,
            cards: l.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
        })));
    };

    const deleteCard = async (cardId) => {
        try {
            await api.delete(`/boards/cards/${cardId}`);
            setLists(prev => prev.map(l => ({ ...l, cards: l.cards.filter(c => c.id !== cardId) })));
        } catch (err) {
            console.error(err);
        }
    }

    const handleDragStart = (event) => {
        const { active } = event;
        if (active.data.current?.type === 'Column') {
            setActiveList(active.data.current.list);
        } else {
            setActiveCard(active.data.current.card);
        }
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over || active.data.current?.type === 'Column') return;

        const activeId = active.id;
        const overId = over.id;

        const activeContainer = active.data.current?.sortable?.containerId;
        const overContainer = over.data.current?.sortable?.containerId || overId;

        if (activeContainer === overContainer) return;

        setLists((prev) => {
            const activeListIndex = prev.findIndex(l => l.id === activeContainer);
            const overListIndex = prev.findIndex(l => l.id === overContainer);

            const newLists = [...prev];
            if (activeListIndex === -1 || overListIndex === -1) return prev;

            const activeList = { ...newLists[activeListIndex], cards: [...newLists[activeListIndex].cards] };
            const overList = { ...newLists[overListIndex], cards: [...newLists[overListIndex].cards] };

            const cardIndex = activeList.cards.findIndex(c => c.id === activeId);
            const [movedCard] = activeList.cards.splice(cardIndex, 1);

            // Add to new list
            const overCardIndex = overList.cards.findIndex(c => c.id === overId);
            const newIndex = overCardIndex >= 0 ? overCardIndex : overList.cards.length;
            overList.cards.splice(newIndex, 0, { ...movedCard, listId: overContainer });

            newLists[activeListIndex] = activeList;
            newLists[overListIndex] = overList;

            return newLists;
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveCard(null);
        setActiveList(null);

        if (!over) return;

        // Handle List Reordering
        if (active.data.current?.type === 'Column') {
            const activeIndex = lists.findIndex(l => l.id === active.id);
            const overIndex = lists.findIndex(l => l.id === over.id);

            if (activeIndex !== overIndex) {
                const newLists = arrayMove(lists, activeIndex, overIndex);
                setLists(newLists);

                // Sync with backend
                const listOrders = newLists.map((l, idx) => ({ listId: l.id, order: idx * 100 }));
                await api.put(`/boards/${id}/lists/reorder`, { listOrders });
            }
            return;
        }

        // Handle Card reordering/move
        const activeId = active.id;
        const overId = over.id;

        let targetList = null;
        let card = null;
        let index = -1;

        lists.forEach(l => {
            const idx = l.cards.findIndex(c => c.id === activeId);
            if (idx !== -1) {
                card = l.cards[idx];
                targetList = l;
                index = idx;
            }
        });

        if (card && targetList) {
            let newOrder = 100;
            const cards = targetList.cards;

            if (cards.length > 1) {
                if (index === 0) {
                    newOrder = cards[1].order / 2;
                } else if (index === cards.length - 1) {
                    newOrder = cards[index - 1].order + 100;
                } else {
                    newOrder = (cards[index - 1].order + cards[index + 1].order) / 2;
                }
            }

            await api.put(`/boards/cards/${activeId}`, {
                listId: targetList.id,
                order: newOrder
            });
        }
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-screen bg-blue-50 space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <span className="text-blue-600 font-bold tracking-widest animate-pulse">Loading Board...</span>
        </div>
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div
                className="h-screen flex flex-col transition-all duration-700 overflow-hidden"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Modern Transparent Header */}
                <header className="backdrop-blur-md bg-black/40 p-4 text-white flex justify-between items-center border-b border-white/10 shadow-2xl relative z-40">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="hover:bg-white/20 p-2 rounded-xl transition-all"><ArrowLeft size={20} /></Link>
                        <div className="flex flex-col">
                            <h1 className="font-extrabold text-xl tracking-tight">{board.title}</h1>
                            <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Team Board</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <BoardFilter activeFilters={filters} onFilterChange={setFilters} />

                        <div className="h-6 w-[1px] bg-white/10 mx-2" />

                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-3 pr-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white/20 flex items-center justify-center font-bold text-xs shadow-lg" title={`Owner: ${board.owner.name}`}>
                                    {board.owner.name.charAt(0)}
                                </div>
                                {board.members.map(m => (
                                    <div key={m._id} className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white/20 flex items-center justify-center font-bold text-xs shadow-lg" title={m.name}>
                                        {m.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all text-white flex items-center gap-2 text-xs font-bold"
                            >
                                <Share2 size={16} />
                                Invite
                            </button>
                            <button
                                onClick={() => setShowLogView(!showLogView)}
                                className={`p-2 rounded-lg transition-all ${showLogView ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
                                title="View Activity"
                            >
                                <History size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Board Body */}
                <main className="flex-1 overflow-x-auto overflow-y-hidden p-8 scroll-smooth custom-scrollbar">
                    <div className="flex gap-6 h-full items-start">
                        <SortableContext items={filteredLists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
                            {filteredLists.map(list => (
                                <Column
                                    key={list.id}
                                    list={list}
                                    cards={list.cards}
                                    onDeleteList={deleteList}
                                    onAddCard={addCard}
                                    onCardClick={setSelectedCard}
                                    onDeleteCard={deleteCard}
                                />
                            ))}
                        </SortableContext>

                        {/* Add List Trigger */}
                        <div className="w-72 flex-shrink-0">
                            <form onSubmit={addList} className="bg-white/10 backdrop-blur-md p-3 rounded-xl hover:bg-white/20 transition-all border border-white/10 group shadow-lg">
                                <input
                                    className="w-full p-2 bg-transparent text-white placeholder-white/50 text-sm border-none focus:ring-0 outline-none"
                                    placeholder="+ Add another list"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                />
                                {newListTitle && (
                                    <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs w-full transition-all shadow-md">
                                        Add List
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </main>

                {/* Modals & Overlays */}
                {showLogView && (
                    <AuditLogView boardId={id} onClose={() => setShowLogView(false)} />
                )}

                {showInviteModal && (
                    <InviteMemberModal
                        boardId={id}
                        onClose={() => setShowInviteModal(false)}
                        onInvite={(members) => setBoard({ ...board, members })}
                    />
                )}

                {selectedCard && (
                    <CardDetailModal
                        card={selectedCard}
                        onClose={() => setSelectedCard(null)}
                        onUpdate={updateCard}
                        onDelete={deleteCard}
                    />
                )}

                <DragOverlay adjustScale={false}>
                    {activeCard ? <TaskCard card={activeCard} /> : null}
                    {activeList ? <Column list={activeList} cards={activeList.cards} /> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
