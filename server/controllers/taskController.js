const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

exports.getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ where: { userId: Number(req.userId) } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

exports.createTask = async (req, res) => {
  const { title, created_at, due_date, priority, note, reason, status, assigned_to, priority_tags } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        title,
        created_at,
        due_date,
        priority,
        note,
        reason,
        status,
        assigned_to,
        priority_tags,
        userId: Number(req.userId)
      },
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Failed to create task' });
  }
};

exports.getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findFirst({
      where: { id: id, userId: Number(req.userId) }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Failed to fetch task' });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const task = await prisma.task.findFirst({
      where: { id: id, userId: Number(req.userId) }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const updatedTask = await prisma.task.update({ where: { id: id }, data });
    res.status(200).json(updatedTask);
  } catch {
    res.status(500).json({ message: 'Failed to update task' });
  }
};
