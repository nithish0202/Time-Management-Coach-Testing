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
  let {
    title,
    created_at,
    due_date,
    priority,
    note,
    reason,
    status,
    assigned_to,
    priority_tags
  } = req.body;

  const createdAtDate = created_at && !isNaN(new Date(created_at)) ? new Date(created_at) : null;
  const dueDateDate = due_date && !isNaN(new Date(due_date)) ? new Date(due_date) : null;


  const strategicTags = ['Strategic Work', 'Deadline', 'Project Delivery Work'];
  const typeTags = priority_tags?.type || [];

  const hasStrategicTag = typeTags.some(tag => strategicTags.includes(tag));
  if (hasStrategicTag) {
    priority = 'high';
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        created_at: createdAtDate,
        due_date: dueDateDate,
        priority,
        note,
        reason,
        status,
        assigned_to,
        priority_tags,
        userId: Number(req.userId),
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};


exports.updateTask = async (req, res) => {
  const { id } = req.params;
  let {
    title,
    created_at,
    due_date,
    priority,
    note,
    reason,
    status,
    assigned_to,
    priority_tags
  } = req.body;

  const createdAtDate = created_at && !isNaN(new Date(created_at)) ? new Date(created_at) : null;
  const dueDateDate = due_date && !isNaN(new Date(due_date)) ? new Date(due_date) : null;

  
  const strategicTags = ['Strategic Work', 'Deadline', 'Project Delivery Work'];
  const typeTags = priority_tags?.type || [];

  const hasStrategicTag = typeTags.some(tag => strategicTags.includes(tag));
  if (hasStrategicTag) {
    priority = 'high';
  }

  try {
    const task = await prisma.task.findFirst({
      where: { id: id, userId: Number(req.userId) },
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: {
        title,
        created_at: createdAtDate,
        due_date: dueDateDate,
        priority,
        note,
        reason,
        status,
        assigned_to,
        priority_tags,
      },
    });
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update task' });
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