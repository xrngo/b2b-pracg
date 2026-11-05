const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Жесткий лимит на попытки входа/регистрации (защита от перебора паролей)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 15, // максимум 15 попыток
  message: { error: 'Слишком много попыток входа. Подождите 15 минут.' },
});

// Схема валидации данных при регистрации дилера
const registerSchema = z.object({
  email: z.string().email('Некорректный формат Email').trim().toLowerCase(),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  companyName: z.string().min(2, 'Укажите название компании').trim(),
  inn: z.string().regex(/^\d{10}(\d{2})?$/, 'ИНН должен состоять из 10 или 12 цифр'),
  phone: z.string().min(6, 'Укажите контактный телефон').trim(),
});

// Настройки безопасной куки
const setTokenCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('b2b_token', token, {
    httpOnly: true, // Недоступна из JS в браузере (защита от XSS)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Защита от CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  });
};

// 1. Регистрация (Подача заявки дилера)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validatedData.email }, { inn: validatedData.inn }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Компания с таким Email или ИНН уже зарегистрирована' });
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Если в базе еще 0 пользователей — делаем первого зарегистрированного АДМИНОМ
    const usersCount = await prisma.user.count();
    const isFirstUser = usersCount === 0;

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        companyName: validatedData.companyName,
        inn: validatedData.inn,
        phone: validatedData.phone,
        role: isFirstUser ? 'ADMIN' : 'DEALER',
        isVerified: isFirstUser ? true : false,
        dealerTier: isFirstUser ? 'GOLD' : 'BRONZE',
      },
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

    setTokenCookie(res, user.id);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// 2. Вход в систему
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Введите Email и пароль' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный Email или пароль' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный Email или пароль' });
    }

    setTokenCookie(res, user.id);

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// 3. Выход (очистка куки)
router.post('/logout', (req, res) => {
  res.clearCookie('b2b_token');
  res.json({ message: 'Вы вышли из системы' });
});

// 4. Получение текущего профиля (при перезагрузке страницы в React)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;