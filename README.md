# Habit Tracker — Telegram Mini App

Минималистичный трекер привычек в Telegram Mini App:
- без регистрации;
- без подписок;
- с хранением в Telegram CloudStorage;
- с напоминаниями через Telegram Bot.

## Структура проекта

- `frontend/` — React + Vite + TypeScript + Tailwind + `@twa-dev/sdk`
- `backend/` — Node.js + Express + Telegraf + `node-cron`

## MVP функции

### Frontend
- список привычек на сегодня;
- отметка выполнения чекбоксом;
- автоматический расчёт стрика и рекорда;
- хранение данных в `Telegram CloudStorage` (fallback: `localStorage`);
- прогресс-бар дня;
- добавление привычки (название, emoji, время);
- Telegram-aware тёмная тема.

### Backend
- `POST /reminder` — upsert напоминания;
- `DELETE /reminder/:id?telegramUserId=...` — удалить напоминание;
- cron каждую минуту проверяет время и отправляет сообщение,
  если привычка ещё не отмечена сегодня.

## Переменные окружения

### Frontend
Скопируй `frontend/.env.example` в `frontend/.env`:

`VITE_BACKEND_URL=http://localhost:3001`

### Backend
Скопируй `backend/.env.example` в `backend/.env`:

- `BOT_TOKEN` — токен бота от BotFather
- `PORT` — порт сервера (по умолчанию `3001`)

## Локальный запуск

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 2) Backend

```bash
cd backend
npm install
npm run dev
```

## Деплой

- `frontend` → Vercel
- `backend` → Railway

После деплоя фронтенда:
1. проставь `VITE_BACKEND_URL` на URL backend;
2. укажи Mini App URL в BotFather;
3. открой бота и отправь `/start`.

## Ключевые файлы

- `frontend/src/hooks/useHabits.ts` — CloudStorage + CRUD + вызовы backend
- `frontend/src/hooks/useStreak.ts` — логика стриков
- `frontend/src/components/*` — UI карточек, формы, прогресса
- `backend/bot.js` — API + Telegraf bootstrap
- `backend/scheduler.js` — планировщик напоминаний
