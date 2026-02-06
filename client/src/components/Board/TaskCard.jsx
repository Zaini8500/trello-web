import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Calendar, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskCard({ card, onDelete, onClick }) {
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
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(card.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick(card)}
            className="bg-white p-3 rounded-lg shadow-sm mb-2 group relative border border-gray-100 hover:border-blue-300 transition-all cursor-pointer select-none"
        >
            <div className="flex flex-wrap gap-1 mb-2">
                {card.labels?.map((label, idx) => (
                    <div
                        key={idx}
                        className="h-1.5 w-8 rounded-full"
                        style={{ backgroundColor: label.color }}
                        title={label.name}
                    />
                ))}
            </div>

            <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-gray-700 leading-tight flex-1">{card.title}</h4>
                <button
                    onClick={handleDelete}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="flex items-center gap-3 mt-3">
                {card.description && (
                    <div className="text-gray-400" title="Has description">
                        <AlignLeft size={12} />
                    </div>
                )}
                {card.dueDate && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${new Date(card.dueDate) < new Date() ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                        }`}>
                        <Calendar size={10} />
                        {format(new Date(card.dueDate), 'MMM dd')}
                    </div>
                )}
            </div>
        </div>
    );
}
