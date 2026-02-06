import { useState, useEffect } from 'react';
import { Filter, X, Tag, Calendar } from 'lucide-react';

export default function BoardFilter({ activeFilters, onFilterChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const LABEL_COLORS = [
        { name: 'emerald', color: '#10b981' },
        { name: 'blue', color: '#3b82f6' },
        { name: 'amber', color: '#f59e0b' },
        { name: 'rose', color: '#f43f5e' },
        { name: 'violet', color: '#8b5cf6' },
        { name: 'slate', color: '#64748b' },
    ];

    const toggleLabelFilter = (labelName) => {
        const current = activeFilters.labels || [];
        const updated = current.includes(labelName)
            ? current.filter(l => l !== labelName)
            : [...current, labelName];
        onFilterChange({ ...activeFilters, labels: updated });
    };

    const clearFilters = () => {
        onFilterChange({ labels: [], dueDateFrom: '', dueDateTo: '' });
    };

    const hasActiveFilters = (activeFilters.labels?.length > 0) || activeFilters.dueDateFrom || activeFilters.dueDateTo;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
            >
                <Filter size={16} />
                Filter {hasActiveFilters && `(${(activeFilters.labels?.length || 0) + (activeFilters.dueDateFrom ? 1 : 0)})`}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-xl shadow-2xl z-50 p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter Cards</h4>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-[10px] text-blue-600 font-bold hover:underline">Clear all</button>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 mb-2 flex items-center gap-1 uppercase">
                                    <Tag size={10} /> Labels
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {LABEL_COLORS.map(l => {
                                        const isActive = activeFilters.labels?.includes(l.name);
                                        return (
                                            <button
                                                key={l.name}
                                                onClick={() => toggleLabelFilter(l.name)}
                                                style={{ backgroundColor: isActive ? l.color : '#f3f4f6', color: isActive ? 'white' : '#64748b' }}
                                                className="px-2 py-1 rounded text-[10px] font-bold"
                                            >
                                                {l.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-gray-500 mb-2 flex items-center gap-1 uppercase">
                                    <Calendar size={10} /> Due Date Range
                                </p>
                                <div className="space-y-2">
                                    <input
                                        type="date"
                                        className="w-full text-xs p-2 border border-gray-100 rounded bg-gray-50 outline-none"
                                        value={activeFilters.dueDateFrom || ''}
                                        placeholder="From"
                                        onChange={e => onFilterChange({ ...activeFilters, dueDateFrom: e.target.value })}
                                    />
                                    <input
                                        type="date"
                                        className="w-full text-xs p-2 border border-gray-100 rounded bg-gray-50 outline-none"
                                        value={activeFilters.dueDateTo || ''}
                                        placeholder="To"
                                        onChange={e => onFilterChange({ ...activeFilters, dueDateTo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
