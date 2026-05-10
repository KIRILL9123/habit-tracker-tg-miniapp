import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { Telegraf } from "telegraf";
import { startScheduler } from "./scheduler.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const BOT_TOKEN = process.env.BOT_TOKEN;
const DB_PATH = process.env.DB_PATH || "./data/reminders.sqlite";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required");
}

const dbPath = path.resolve(DB_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

const createTable = `
CREATE TABLE IF NOT EXISTS reminders (
  habit_id TEXT NOT NULL,
  telegram_user_id INTEGER NOT NULL,
  habit_name TEXT NOT NULL,
  reminder_time TEXT NOT NULL,
  timezone_offset INTEGER NOT NULL DEFAULT 0,
  completed_today INTEGER NOT NULL DEFAULT 0,
  completed_date TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (habit_id, telegram_user_id)
);
`;

db.exec(createTable);

const upsertReminderStatement = db.prepare(`
INSERT INTO reminders (
  habit_id,
  telegram_user_id,
  habit_name,
  reminder_time,
  timezone_offset,
  completed_today,
  completed_date,
  updated_at
)
VALUES (
  @habitId,
  @telegramUserId,
  @habitName,
  @reminderTime,
  @timezoneOffset,
  @completedToday,
  @completedDate,
  @updatedAt
)
ON CONFLICT(habit_id, telegram_user_id)
DO UPDATE SET
  habit_name = excluded.habit_name,
  reminder_time = excluded.reminder_time,
  timezone_offset = excluded.timezone_offset,
  completed_today = excluded.completed_today,
  completed_date = excluded.completed_date,
  updated_at = excluded.updated_at;
`);

const removeReminderStatement = db.prepare(`
DELETE FROM reminders
WHERE habit_id = ? AND telegram_user_id = ?;
`);

const markSentStatement = db.prepare(`
UPDATE reminders
SET completed_today = 1,
    completed_date = ?,
    updated_at = ?
WHERE habit_id = ? AND telegram_user_id = ?;
`);

const listRemindersStatement = db.prepare(`
SELECT
  habit_id,
  telegram_user_id,
  habit_name,
  reminder_time,
  timezone_offset,
  completed_today,
  completed_date
FROM reminders;
`);

const bot = new Telegraf(BOT_TOKEN);

const reminderTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isNonEmptyString = (value, maxLength = 255) => {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
};

const toInt = (value) => {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    return null;
  }

  return parsed;
};

const validateReminderPayload = (payload) => {
  if (!isNonEmptyString(payload.habitId, 128)) {
    return "habitId must be a non-empty string";
  }

  if (!isNonEmptyString(payload.habitName, 120)) {
    return "habitName must be a non-empty string up to 120 chars";
  }

  if (
    !isNonEmptyString(payload.reminderTime, 5) ||
    !reminderTimeRegex.test(payload.reminderTime)
  ) {
    return "reminderTime must be in HH:MM format";
  }

  const telegramUserId = toInt(payload.telegramUserId);

  if (telegramUserId === null || telegramUserId <= 0) {
    return "telegramUserId must be a positive integer";
  }

  if (payload.timezoneOffset !== undefined && payload.timezoneOffset !== null) {
    const timezoneOffset = Number(payload.timezoneOffset);

    if (
      !Number.isFinite(timezoneOffset) ||
      timezoneOffset < -840 ||
      timezoneOffset > 840
    ) {
      return "timezoneOffset must be a number between -840 and 840";
    }
  }

  if (payload.completedDate && !isoDateRegex.test(payload.completedDate)) {
    return "completedDate must be YYYY-MM-DD";
  }

  return null;
};

const getReminders = () => {
  return listRemindersStatement.all().map((row) => ({
    habitId: row.habit_id,
    telegramUserId: row.telegram_user_id,
    habitName: row.habit_name,
    reminderTime: row.reminder_time,
    timezoneOffset: row.timezone_offset,
    completedToday: Boolean(row.completed_today),
    completedDate: row.completed_date,
  }));
};

const upsertReminder = (payload) => {
  const nowISO = new Date().toISOString();

  upsertReminderStatement.run({
    habitId: payload.habitId,
    telegramUserId: payload.telegramUserId,
    habitName: payload.habitName,
    reminderTime: payload.reminderTime,
    timezoneOffset: payload.timezoneOffset,
    completedToday: payload.completedToday ? 1 : 0,
    completedDate: payload.completedDate,
    updatedAt: nowISO,
  });
};

const removeReminder = (habitId, telegramUserId) => {
  removeReminderStatement.run(habitId, telegramUserId);
};

const markReminderSentToday = (habitId, telegramUserId, date) => {
  markSentStatement.run(
    date,
    new Date().toISOString(),
    habitId,
    telegramUserId,
  );
};

app.use(cors());
app.use(express.json());

bot.start((ctx) => {
  ctx.reply(
    "Habit Tracker bot активирован. Открой мини-приложение и добавь привычки 💪",
  );
});

app.post("/reminder", (req, res) => {
  const validationError = validateReminderPayload(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const {
    habitId,
    habitName,
    reminderTime,
    telegramUserId,
    timezoneOffset,
    completedToday,
    completedDate,
  } = req.body;

  const doneToday = Boolean(completedToday);

  upsertReminder({
    habitId: String(habitId).trim(),
    habitName: String(habitName).trim(),
    reminderTime: String(reminderTime),
    telegramUserId: Number(telegramUserId),
    timezoneOffset: Number.isFinite(Number(timezoneOffset))
      ? Number(timezoneOffset)
      : 0,
    completedToday: doneToday,
    completedDate: doneToday ? completedDate || null : null,
  });

  return res.status(201).json({ ok: true });
});

app.delete("/reminder/:id", (req, res) => {
  const habitId = req.params.id;
  const telegramUserId = toInt(req.query.telegramUserId);

  if (!isNonEmptyString(habitId, 128)) {
    return res.status(400).json({ error: "habitId is required" });
  }

  if (telegramUserId === null || telegramUserId <= 0) {
    return res
      .status(400)
      .json({ error: "telegramUserId must be a positive integer" });
  }

  removeReminder(habitId, telegramUserId);
  return res.status(200).json({ ok: true });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

startScheduler({
  getReminders,
  markReminderSentToday,
  bot,
});

bot.launch();

app.listen(PORT, () => {
  console.log(`Habit Tracker backend started on ${PORT}`);
});

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  db.close();
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  db.close();
});
