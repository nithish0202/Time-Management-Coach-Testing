const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

exports.getQTasks = async (req, res) => {
  try {
    const qtasks = await prisma.qtask.findMany({ where: { userId: Number(req.userId) } });
    res.json(qtasks);
  } catch {
    res.status(500).json({ message: 'Failed to fetch qtasks' });
  }
};

exports.createQTask = async (req, res) => {
  const { date, workTasks, personalTasks, notes, timeSpent } = req.body;
  try {
    const qtask = await prisma.qtask.create({
      data: {
        date,
        workTasks: workTasks.join(', '),
        personalTasks: personalTasks.join(', '),
        notes,
        timeSpent,
        userId: Number(req.userId)
      },
    });
    res.status(201).json(qtask);
  } catch {
    res.status(500).json({ message: 'Failed to create qtask' });
  }
};
