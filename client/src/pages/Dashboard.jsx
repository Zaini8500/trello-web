import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export default function Dashboard() {
    const [boards, setBoards] = useState([]);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const { logout, user } = useAuth();

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const { data } = await api.get('/boards');
            setBoards(data);
        } catch (err) {
            console.error(err);
        }
    };

    const createBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle) return;
        try {
            const { data } = await api.post('/boards', { title: newBoardTitle });
            setBoards([...boards, data]);
            setNewBoardTitle('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">Trello Clone</h1>
                <div className="flex items-center gap-4">
                    <span>Welcome, {user?.name}</span>
                    <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-8">
                <h2 className="text-2xl font-bold mb-6">Your Boards</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {boards.map(board => (
                        <Link
                            key={board.id}
                            to={`/board/${board.id}`}
                            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition block h-32 flex flex-col justify-between"
                        >
                            <h3 className="font-bold text-lg">{board.title}</h3>
                            <span className="text-xs text-gray-400">Owner: {board.owner.name}</span>
                        </Link>
                    ))}

                    <div className="bg-gray-200 p-6 rounded-lg h-32 flex flex-col justify-center items-center">
                        <input
                            className="p-2 w-full text-sm mb-2 rounded border"
                            placeholder="New Board Title"
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                        />
                        <button
                            onClick={createBoard}
                            className="bg-blue-600 text-white px-4 py-1 rounded text-sm flex items-center gap-1 hover:bg-blue-700 w-full justify-center"
                        >
                            <Plus size={16} /> Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
