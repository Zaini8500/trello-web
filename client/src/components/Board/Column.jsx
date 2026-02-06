import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus, X } from 'lucide-react';

export default function Column({ list, cards, onDeleteList, onAddCard, onDeleteCard }) {
    // Column itself can be sortable if we want to reorder columns (lists)
    // For basic MVP we might just make cards sortable.
    // But let's adding hook for future list reordering if needed.

    const [newCardTitle, setNewCardTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddCard = (e) => {
        e.preventDefault();
        if (newCardTitle.trim()) {
            onAddCard(list.id, newCardTitle);
            setNewCardTitle("");
            setIsAdding(false);
        }
    }

    return (
        <div className="bg-gray-100 w-72 flex-shrink-0 rounded-lg p-3 flex flex-col max-h-full">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-bold text-gray-700 text-sm">{list.title}</h3>
                <button onClick={() => onDeleteList(list.id)} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-2">
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <TaskCard key={card.id} card={card} onDelete={onDeleteCard} />
                    ))}
                </SortableContext>
            </div>

            {isAdding ? (
                <form onSubmit={handleAddCard} className="mt-2">
                    <input
                        autoFocus
                        className="w-full p-2 text-sm rounded border mb-2"
                        placeholder="Card title..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded">Add</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 text-xs px-2">Cancel</button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 flex items-center gap-1 text-gray-500 hover:bg-gray-200 p-2 rounded w-full text-sm text-left transition"
                >
                    <Plus size={16} /> Add a card
                </button>
            )}
        </div>
    );
}
