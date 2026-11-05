require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const prisma = require('./prisma');

const app = express();

// 1. Защита HTTP-заголовков
app.use(helmet());

// 2. Строгий CORS: разрешаем запросы и куки только с нашего фронтенда
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// 3. ограничиваем размер тела запроса до 10kb для защиты от DDoS
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 4. Глобальный лимит запросов (максимум 100 запросов за 15 минут с одного IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов, попробуйте позже' },
});
app.use('/api', apiLimiter);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 5. Тестовый роут для проверки связи с сервером и базой
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ 
      status: 'ok', 
      message: 'Защищенный B2B сервер работает!', 
      usersInDb: userCount 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Ошибка подключения к БД' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});