import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

export default function TaskCard({ card, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: {
            type: "Card",
            card,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 rounded shadow-sm mb-2 group relative border border-gray-100 hover:border-blue-300 touch-none"
        >
            <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium text-gray-800 break-words">{card.title}</h4>
                <button
                    onClick={() => onDelete(card.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                    <X size={14} />
                </button>
            </div>
            {card.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">{card.description}</p>
            )}
        </div>
    );
}
