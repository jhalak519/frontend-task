import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { LogOut, Plus, Search, Trash2, Edit2, CheckCircle, XCircle, Clock } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        pending: tasks.filter(t => t.status === 'pending').length
    };

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentTask, setCurrentTask] = useState(null); // For editing
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending'
    });

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to fetch tasks');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.delete(`/tasks/${id}`);
                setTasks(tasks.filter(task => task._id !== id));
                toast.success('Task deleted');
            } catch (err) {
                toast.error('Failed to delete task');
            }
        }
    };

    const handleEditClick = (task) => {
        setIsEditing(true);
        setCurrentTask(task);
        setFormData({
            title: task.title,
            description: task.description,
            status: task.status
        });
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const res = await api.put(`/tasks/${currentTask._id}`, formData);
                setTasks(tasks.map(t => t._id === currentTask._id ? res.data : t));
                toast.success('Task updated');
            } else {
                const res = await api.post('/tasks', formData);
                setTasks([res.data, ...tasks]);
                toast.success('Task created');
            }
            resetForm();
        } catch (err) {
            toast.error(isEditing ? 'Failed to update task' : 'Failed to create task');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', status: 'pending' });
        setIsEditing(false);
        setCurrentTask(null);
        setShowForm(false);
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.description.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <nav className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">TaskFlow</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-500 hidden sm:block">Welcome, <span className="font-semibold text-slate-800">{user?.name}</span></span>
                            <button
                                onClick={logout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 bg-white hover:text-slate-700 hover:bg-slate-50 focus:outline-none transition"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-indigo-100 rounded-md p-3">
                                        <Clock className="h-6 w-6 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-slate-500 truncate">Total Tasks</dt>
                                        <dd className="text-2xl font-semibold text-slate-900">{stats.total}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-yellow-100 rounded-md p-3">
                                        <Clock className="h-6 w-6 text-yellow-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-slate-500 truncate">Pending</dt>
                                        <dd className="text-2xl font-semibold text-slate-900">{stats.pending}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-blue-100 rounded-md p-3">
                                        <Clock className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-slate-500 truncate">In Progress</dt>
                                        <dd className="text-2xl font-semibold text-slate-900">{stats.inProgress}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-green-100 rounded-md p-3">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-slate-500 truncate">Completed</dt>
                                        <dd className="text-2xl font-semibold text-slate-900">{stats.completed}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto justify-center"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Task
                        </button>
                    </div>
                </div>

                {/* Form Modal/Inline */}
                {showForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <form onSubmit={handleFormSubmit} className="p-6">
                                    <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Description</label>
                                            <textarea
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                                rows="3"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Status</label>
                                            <select
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm">
                                            {isEditing ? 'Update' : 'Create'}
                                        </button>
                                        <button type="button" onClick={() => setShowForm(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-xl border-2 border-dashed border-slate-200">
                        <div className="mx-auto h-12 w-12 text-slate-400">
                            <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No tasks found</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by creating a new task.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => { resetForm(); setShowForm(true); }}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                New Task
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTasks.map(task => (
                            <div key={task._id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleEditClick(task)} className="text-slate-400 hover:text-indigo-600 transition">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(task._id)} className="text-slate-400 hover:text-red-600 transition">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{task.title}</h3>
                                    <p className="text-slate-600 text-sm line-clamp-3">{task.description}</p>
                                </div>
                                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
                                    <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
