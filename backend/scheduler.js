import cron from "node-cron";

const DAY_MINUTES = 24 * 60;

const toMinutes = (value) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

const normalizeMinutes = (value) =>
  ((value % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

const getUserLocalDate = (nowTimestamp, timezoneOffset) => {
  const localMs = nowTimestamp - timezoneOffset * 60 * 1000;
  return new Date(localMs).toISOString().slice(0, 10);
};

const shouldSendReminderNow = (item, now) => {
  const userDate = getUserLocalDate(now.timestamp, item.timezoneOffset);

  if (item.completedDate === userDate) {
    return false;
  }

  const reminderMinutes = toMinutes(item.reminderTime);
  const userNowMinutes = normalizeMinutes(now.utcMinutes - item.timezoneOffset);

  return reminderMinutes === userNowMinutes;
};

export const startScheduler = ({
  getReminders,
  markReminderSentToday,
  bot,
}) => {
  cron.schedule("* * * * *", async () => {
    const nowDate = new Date();
    const now = {
      timestamp: nowDate.getTime(),
      utcMinutes: nowDate.getUTCHours() * 60 + nowDate.getUTCMinutes(),
    };

    const reminders = getReminders();

    for (const reminder of reminders) {
      if (!shouldSendReminderNow(reminder, now)) {
        continue;
      }

      const userDate = getUserLocalDate(now.timestamp, reminder.timezoneOffset);

      await bot.telegram.sendMessage(
        reminder.telegramUserId,
        `Не забудь: ${reminder.habitName} 💪`,
      );

      markReminderSentToday(
        reminder.habitId,
        reminder.telegramUserId,
        userDate,
      );
    }
  });
};
