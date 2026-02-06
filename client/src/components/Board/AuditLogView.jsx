import { useState, useEffect } from 'react';
import { X, History, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function AuditLogView({ boardId, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/boards/${boardId}/audit-logs?page=${page}&limit=15`);
            setLogs(data.logs);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionText = (log) => {
        const user = log.user?.name || 'Someone';
        const type = log.entityType.toLowerCase();

        switch (log.action) {
            case 'create':
                return `${user} created a new ${type} "${log.metadata?.title || ''}"`;
            case 'update':
                return `${user} updated ${type}`;
            case 'move':
                return `${user} moved ${type} to a new list`;
            case 'delete':
                return `${user} deleted ${type} "${log.metadata?.title || ''}"`;
            case 'invite':
                return `${user} invited ${log.metadata?.email || 'a member'}`;
            default:
                return `${user} performed ${log.action} on ${type}`;
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold flex items-center gap-2 text-gray-700">
                    <History size={18} />
                    Activity Log
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm mt-10">No activity recorded yet.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="border-b border-gray-50 pb-3 last:border-0">
                            <p className="text-sm text-gray-800 leading-relaxed">
                                {getActionText(log)}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <button
                    disabled={page === 1 || loading}
                    onClick={() => setPage(prev => prev - 1)}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-xs text-gray-500 font-medium">
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page === totalPages || loading}
                    onClick={() => setPage(prev => prev + 1)}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
