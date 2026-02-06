import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus, X, MoreHorizontal } from 'lucide-react';

export default function Column({ list, cards, onDeleteList, onAddCard, onCardClick, onDeleteCard }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: list.id,
        data: {
            type: "Column",
            list,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

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
        <div
            ref={setNodeRef}
            style={style}
            className="bg-gray-100/90 backdrop-blur-sm w-72 flex-shrink-0 rounded-xl p-3 flex flex-col max-h-full border border-gray-200 shadow-sm"
        >
            <div className="flex justify-between items-center mb-3 px-1" {...attributes} {...listeners}>
                <h3 className="font-bold text-gray-800 text-sm tracking-tight">{list.title}</h3>
                <button onClick={() => onDeleteList(list.id)} className="text-gray-400 hover:text-red-500 p-1 hover:bg-white rounded transition-colors">
                    <X size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-2">
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <TaskCard
                            key={card.id}
                            card={{ ...card, listName: list.title }}
                            onDelete={onDeleteCard}
                            onClick={onCardClick}
                        />
                    ))}
                </SortableContext>
            </div>

            {isAdding ? (
                <form onSubmit={handleAddCard} className="mt-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                    <textarea
                        autoFocus
                        className="w-full p-2 text-sm rounded bg-gray-50 border-none focus:ring-1 ring-blue-500 outline-none resize-none h-20"
                        placeholder="What needs to be done?"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                        <button type="submit" className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Add Card</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 flex items-center gap-2 text-gray-500 font-semibold hover:bg-gray-200/50 p-2 rounded-lg w-full text-xs text-left transition-all group"
                >
                    <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
                    Add a card
                </button>
            )}
        </div>
    );
}
