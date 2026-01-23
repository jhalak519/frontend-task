import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { LogOut, Plus, Search, Trash2, Edit2, CheckCircle, Clock, ChevronLeft, ChevronRight, ArrowUpDown, Calendar, Flag, AlertTriangle, X } from 'lucide-react';

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, taskTitle, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="delete-modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-brand-primary/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="z-10 relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-slate-900" id="delete-modal-title">
                                    Delete Task
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500">
                                        Are you sure you want to delete "<span className="font-semibold text-slate-700">{taskTitle}</span>"? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-brand-bg px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={onConfirm}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination & Sorting State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const limit = 12;

    // Bulk Selection State
    const [selectedTasks, setSelectedTasks] = useState(new Set());

    // Stats State
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
    });

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: ''
    });

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks', {
                params: { page, limit, sortBy, sortOrder }
            });
            setTasks(res.data.tasks);
            setStats(res.data.stats || { total: 0, completed: 0, inProgress: 0, pending: 0 });
            setTotalPages(res.data.pages);
            setTotal(res.data.total);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to fetch tasks');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [page, sortBy, sortOrder]);

    const openDeleteModal = (task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setTaskToDelete(null);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/tasks/${taskToDelete._id}`);
            setTasks(tasks.filter(task => task._id !== taskToDelete._id));
            setSelectedTasks(prev => {
                const newSet = new Set(prev);
                newSet.delete(taskToDelete._id);
                return newSet;
            });
            toast.success('Task deleted');
            closeDeleteModal();
            fetchTasks();
        } catch (err) {
            toast.error('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTasks.size === 0) return;
        // For bulk delete, we still use confirm for simplicity, or you can extend the modal
        if (!window.confirm(`Are you sure you want to delete ${selectedTasks.size} tasks?`)) return;

        try {
            await api.post('/tasks/bulk-delete', { ids: Array.from(selectedTasks) });
            setTasks(tasks.filter(task => !selectedTasks.has(task._id)));
            setSelectedTasks(new Set());
            toast.success(`${selectedTasks.size} tasks deleted`);
            fetchTasks();
        } catch (err) {
            toast.error('Failed to delete tasks');
        }
    };

    const handleBulkStatusChange = async (status) => {
        if (selectedTasks.size === 0) return;

        try {
            const res = await api.put('/tasks/bulk-status', { ids: Array.from(selectedTasks), status });
            const updatedTasksMap = new Map(res.data.tasks.map(t => [t._id, t]));
            setTasks(tasks.map(t => updatedTasksMap.get(t._id) || t));
            setSelectedTasks(new Set());
            toast.success(`${res.data.tasks.length} tasks updated to ${status}`);
            fetchTasks();
        } catch (err) {
            toast.error('Failed to update tasks');
        }
    };

    const handleEditClick = (task) => {
        setIsEditing(true);
        setCurrentTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority || 'medium',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
        });
        setShowForm(true);
    };

    const openCreateForm = () => {
        setFormData({
            title: '',
            description: '',
            status: 'pending',
            priority: 'medium',
            dueDate: ''
        });
        setIsEditing(false);
        setCurrentTask(null);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setFormData({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' });
        setIsEditing(false);
        setCurrentTask(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Submitting task...");

        try {
            const payload = {
                ...formData,
                dueDate: formData.dueDate ? formData.dueDate : null
            };

            if (isEditing) {
                const res = await api.put(`/tasks/${currentTask._id}`, payload);
                setTasks(tasks.map(t => t._id === currentTask._id ? res.data : t));
                toast.update(toastId, { render: "Task updated successfully", type: "success", isLoading: false, autoClose: 3000 });
            } else {
                const res = await api.post('/tasks', payload);
                setTasks([res.data, ...tasks]);
                toast.update(toastId, { render: "Task created successfully", type: "success", isLoading: false, autoClose: 3000 });
            }
            closeForm();
            fetchTasks();
        } catch (err) {
            console.error('Task form error:', err);
            const errorMsg = err.response?.data?.msg || err.message || "Unknown error";
            toast.update(toastId, { render: `Error: ${errorMsg}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleSelectTask = (id) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedTasks.size === filteredTasks.length) {
            setSelectedTasks(new Set());
        } else {
            setSelectedTasks(new Set(filteredTasks.map(t => t._id)));
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <nav className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-brand-primary tracking-tight">TaskFlow</h1>
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
                                    <div className="bg-brand-soft rounded-md p-3">
                                        <Clock className="h-6 w-6 text-brand-accent" />
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
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm transition duration-150 ease-in-out"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                        {/* Sort Controls */}
                        <select
                            className="bg-white pl-3 pr-8 py-2 text-sm border-slate-300 focus:ring-brand-primary focus:border-brand-primary rounded-lg"
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        >
                            <option value="createdAt">Sort by Date</option>
                            <option value="priority">Sort by Priority</option>
                            <option value="dueDate">Sort by Due Date</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg bg-white hover:bg-slate-50"
                            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
                        </button>

                        <select
                            className="bg-white pl-3 pr-8 py-2 text-sm border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>

                        <button
                            onClick={openCreateForm}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            <Plus className="h-5 w-5 mr-1" />
                            New Task
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedTasks.size > 0 && (
                    <div className="bg-brand-soft border border-brand-accent/20 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-800">
                                {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
                            </span>
                            <button
                                onClick={() => setSelectedTasks(new Set())}
                                className="text-sm text-brand-accent hover:text-brand-accent/80 underline"
                            >
                                Clear selection
                            </button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => handleBulkStatusChange('pending')}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            >
                                Mark Pending
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange('in-progress')}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                                Mark In Progress
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange('completed')}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-800 hover:bg-green-200"
                            >
                                Mark Completed
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}

                {/* Create/Edit Task Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-brand-primary/20 backdrop-blur-sm transition-opacity" onClick={closeForm}></div>

                        {/* Modal Panel */}
                        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
                            <form onSubmit={handleFormSubmit} className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-slate-900">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
                                    <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 border"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Description</label>
                                        <textarea
                                            name="description"
                                            className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 border"
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Status</label>
                                            <select
                                                name="status"
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 border"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Priority</label>
                                            <select
                                                name="priority"
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 border"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Due Date (Optional)</label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 border"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:gap-3">
                                    <button type="button" onClick={closeForm} className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-white hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:text-sm">
                                        {isEditing ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={closeDeleteModal}
                    onConfirm={confirmDelete}
                    taskTitle={taskToDelete?.title || ''}
                    isLoading={isDeleting}
                />

                {/* Task List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
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
                                onClick={openCreateForm}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                New Task
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Select All */}
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                            />
                            <span className="text-sm text-slate-600">Select All</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredTasks.map(task => (
                                <div key={task._id} className={`bg-white rounded-xl shadow-sm border ${selectedTasks.has(task._id) ? 'border-brand-primary ring-2 ring-brand-soft' : 'border-slate-100'} hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col`}>
                                    <div className="p-4 flex-1">
                                        <div className="flex items-start gap-3 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedTasks.has(task._id)}
                                                onChange={() => handleSelectTask(task._id)}
                                                className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex gap-2 flex-wrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(task.status)}`}>
                                                            {task.status}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                                                            <Flag className="h-3 w-3 mr-1" />
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                    <div className="flex space-x-2 ml-2">
                                                        <button onClick={() => handleEditClick(task)} className="text-slate-400 hover:text-brand-primary transition">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => openDeleteModal(task)} className="text-slate-400 hover:text-red-600 transition">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="text-base font-semibold text-slate-900 mb-1 truncate">{task.title}</h3>
                                                <p className="text-slate-600 text-sm line-clamp-2">{task.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-brand-bg px-4 py-2 border-t border-brand-primary/10 text-xs text-slate-500 flex justify-between items-center">
                                        <span className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                        {task.dueDate && (
                                            <span className={`flex items-center ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}`}>
                                                <Calendar className="h-3 w-3 mr-1" />
                                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </button>
                        <span className="text-sm text-slate-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
