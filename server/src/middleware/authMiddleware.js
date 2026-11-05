const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Проверка, что пользователь вошел в систему
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.b2b_token;
    if (!token) {
      return res.status(401).json({ error: 'Необходима авторизация' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        companyName: true,
        inn: true,
        phone: true,
        dealerTier: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
};

// Проверка, что пользователь — администратор (менеджер поставщика)
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ запрещен: требуются права администратора' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };