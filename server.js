const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, User, Project, Task } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function requireManager(req, res, next) {
    if (req.user.role === 'manager' || req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Manager access required' });
}

function requireAdmin(req, res, next) {
    if (req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
}

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role = 'employee' } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ token, user });

    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role']
    });
    res.json(users);
});

app.get('/api/projects', requireAuth, async (req, res) => {
    const projects = await Project.findAll();
    res.json(projects);
});

app.post('/api/projects', requireAuth, requireManager, async (req, res) => {
    const project = await Project.create({
        ...req.body,
        managerId: req.user.id
    });
    res.json(project);
});

app.put('/api/projects/:id', requireAuth, requireManager, async (req, res) => {
    await Project.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Project updated' });
});

app.delete('/api/projects/:id', requireAuth, requireAdmin, async (req, res) => {
    await Project.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
});

app.post('/api/projects/:id/tasks', requireAuth, requireManager, async (req, res) => {
    const task = await Task.create({
        ...req.body,
        projectId: req.params.id
    });
    res.json(task);
});

app.delete('/api/tasks/:id', requireAuth, requireManager, async (req, res) => {
    await Task.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});