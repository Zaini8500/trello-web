import { useState } from 'react';
import { X, Calendar, Tag, Trash2, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';

const LABEL_COLORS = [
    { name: 'emerald', color: '#10b981' },
    { name: 'blue', color: '#3b82f6' },
    { name: 'amber', color: '#f59e0b' },
    { name: 'rose', color: '#f43f5e' },
    { name: 'violet', color: '#8b5cf6' },
    { name: 'slate', color: '#64748b' },
];

export default function CardDetailModal({ card, onClose, onUpdate, onDelete }) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [labels, setLabels] = useState(card.labels || []);
    const [dueDate, setDueDate] = useState(card.dueDate ? format(new Date(card.dueDate), "yyyy-MM-dd'T'HH:mm") : '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const { data } = await api.put(`/boards/cards/${card.id}`, {
                title,
                description,
                labels,
                dueDate: dueDate || null
            });
            onUpdate(data);
            onClose();
        } catch (err) {
            console.error('Update failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLabel = (label) => {
        if (labels.find(l => l.name === label.name)) {
            setLabels(labels.filter(l => l.name !== label.name));
        } else {
            setLabels([...labels, label]);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this card?')) return;
        setLoading(true);
        try {
            await api.delete(`/boards/cards/${card.id}`);
            onDelete(card.id);
            onClose();
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                    <div className="flex-1">
                        <input
                            className="text-xl font-bold w-full bg-transparent border-none focus:ring-0 p-0 text-gray-800"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Card Title"
                        />
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">in list: {card.listName || '...'}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Labels Section */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                            <Tag size={16} /> Labels
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {LABEL_COLORS.map(l => {
                                const isSelected = labels.find(label => label.name === l.name);
                                return (
                                    <button
                                        key={l.name}
                                        onClick={() => toggleLabel(l)}
                                        style={{ backgroundColor: isSelected ? l.color : '#f3f4f6', color: isSelected ? 'white' : '#6b7280' }}
                                        className="px-3 py-1.5 rounded text-xs font-bold transition-all hover:scale-105"
                                    >
                                        {l.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Due Date Section */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                            <Calendar size={16} /> Due Date
                        </h4>
                        <input
                            type="datetime-local"
                            className="p-2 border border-gray-200 rounded text-sm focus:ring-2 ring-blue-500 outline-none"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </div>

                    {/* Description Section */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-tighter">Description</h4>
                        <textarea
                            className="w-full h-32 p-3 border border-gray-100 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all resize-none text-sm leading-relaxed"
                            placeholder="Add a more detailed description..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex justify-between items-center rounded-b-xl sticky bottom-0 border-t border-gray-100">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-sm text-red-500 font-bold hover:text-red-700 p-2 rounded transition-colors"
                    >
                        <Trash2 size={18} /> Delete Card
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm text-gray-500 font-bold hover:bg-gray-200 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="px-6 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
