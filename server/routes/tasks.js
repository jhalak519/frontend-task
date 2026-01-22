const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// @route   GET api/tasks
// @desc    Get all users tasks with pagination and sorting
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Build sort object
        const sortOptions = {};
        if (sortBy === 'priority') {
            // Custom priority sorting: high > medium > low
            sortOptions['priority'] = sortOrder;
        } else {
            sortOptions[sortBy] = sortOrder;
        }

        const skip = (page - 1) * limit;

        const tasks = await Task.find({ user: req.user.id })
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await Task.countDocuments({ user: req.user.id });
        const pages = Math.ceil(total / limit);

        res.json({
            tasks,
            total,
            page,
            pages,
            limit
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks
// @desc    Add new task
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, description, status, priority, dueDate } = req.body;

    try {
        const newTask = new Task({
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            user: req.user.id,
        });

        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, description, status, priority, dueDate } = req.body;

    // Build task object
    const taskFields = {};
    if (title) taskFields.title = title;
    if (description !== undefined) taskFields.description = description;
    if (status) taskFields.status = status;
    if (priority) taskFields.priority = priority;
    if (dueDate !== undefined) taskFields.dueDate = dueDate ? new Date(dueDate) : null;

    try {
        let task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ msg: 'Task not found' });

        // Make sure user owns task
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: taskFields },
            { new: true }
        );

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ msg: 'Task not found' });

        // Make sure user owns task
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks/bulk-delete
// @desc    Delete multiple tasks
// @access  Private
router.post('/bulk-delete', auth, async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'Please provide an array of task IDs' });
    }

    try {
        // Find all tasks to verify ownership
        const tasks = await Task.find({ _id: { $in: ids }, user: req.user.id });

        if (tasks.length !== ids.length) {
            return res.status(401).json({ msg: 'Not authorized to delete some tasks' });
        }

        await Task.deleteMany({ _id: { $in: ids }, user: req.user.id });

        res.json({ msg: `${ids.length} tasks deleted`, deletedIds: ids });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/bulk-status
// @desc    Update status for multiple tasks
// @access  Private
router.put('/bulk-status', auth, async (req, res) => {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'Please provide an array of task IDs' });
    }

    if (!['pending', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status value' });
    }

    try {
        // Verify ownership of all tasks
        const tasks = await Task.find({ _id: { $in: ids }, user: req.user.id });

        if (tasks.length !== ids.length) {
            return res.status(401).json({ msg: 'Not authorized to update some tasks' });
        }

        await Task.updateMany(
            { _id: { $in: ids }, user: req.user.id },
            { $set: { status } }
        );

        // Return updated tasks
        const updatedTasks = await Task.find({ _id: { $in: ids } });

        res.json({ msg: `${ids.length} tasks updated`, tasks: updatedTasks });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
