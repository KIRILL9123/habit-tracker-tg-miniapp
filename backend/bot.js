import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { startScheduler } from "./scheduler.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required");
}

const bot = new Telegraf(BOT_TOKEN);
const storagePath = path.resolve("reminders.json");

const loadReminders = () => {
  if (!fs.existsSync(storagePath)) {
    return [];
  }

  const raw = fs.readFileSync(storagePath, "utf8");

  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const saveReminders = (reminders) => {
  fs.writeFileSync(storagePath, JSON.stringify(reminders, null, 2));
};

let reminders = loadReminders();

const upsertReminder = (payload) => {
  const idx = reminders.findIndex(
    (item) =>
      item.habitId === payload.habitId &&
      item.telegramUserId === payload.telegramUserId,
  );

  if (idx === -1) {
    reminders.push(payload);
  } else {
    reminders[idx] = {
      ...reminders[idx],
      ...payload,
    };
  }

  saveReminders(reminders);
};

const removeReminder = (habitId, telegramUserId) => {
  reminders = reminders.filter(
    (item) =>
      !(
        item.habitId === habitId &&
        String(item.telegramUserId) === String(telegramUserId)
      ),
  );
  saveReminders(reminders);
};

const markReminderSentToday = (habitId, telegramUserId, date) => {
  reminders = reminders.map((item) => {
    if (item.habitId === habitId && item.telegramUserId === telegramUserId) {
      return {
        ...item,
        completedDate: date,
        completedToday: true,
      };
    }

    return item;
  });

  saveReminders(reminders);
};

app.use(cors());
app.use(express.json());

bot.start((ctx) => {
  ctx.reply(
    "Habit Tracker bot активирован. Открой мини-приложение и добавь привычки 💪",
  );
});

app.post("/reminder", (req, res) => {
  const {
    habitId,
    habitName,
    reminderTime,
    telegramUserId,
    timezoneOffset,
    completedToday,
    completedDate,
  } = req.body;

  if (!habitId || !habitName || !reminderTime || !telegramUserId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const doneToday = Boolean(completedToday);

  upsertReminder({
    habitId,
    habitName,
    reminderTime,
    telegramUserId,
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
  const telegramUserId = req.query.telegramUserId;

  if (!habitId || !telegramUserId) {
    return res
      .status(400)
      .json({ error: "habitId and telegramUserId are required" });
  }

  removeReminder(habitId, telegramUserId);
  return res.status(200).json({ ok: true });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

startScheduler({
  getReminders: () => reminders,
  markReminderSentToday,
  bot,
});

bot.launch();

app.listen(PORT, () => {
  console.log(`Habit Tracker backend started on ${PORT}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
