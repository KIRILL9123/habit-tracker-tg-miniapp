import cron from 'node-cron';

const toMinutes = (value) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

const shouldSendReminderNow = (item, now) => {
  if (item.completedDate === now.date) {
    return false;
  }

  const reminderMinutes = toMinutes(item.reminderTime);
  const userNowMinutes = now.utcMinutes - item.timezoneOffset;

  return reminderMinutes === ((userNowMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
};

export const startScheduler = ({ getReminders, markReminderSentToday, bot }) => {
  cron.schedule('* * * * *', async () => {
    const nowDate = new Date();
    const now = {
      date: nowDate.toISOString().slice(0, 10),
      utcMinutes: nowDate.getUTCHours() * 60 + nowDate.getUTCMinutes()
    };

    const reminders = getReminders();

    for (const reminder of reminders) {
      if (!shouldSendReminderNow(reminder, now)) {
        continue;
      }

      await bot.telegram.sendMessage(
        reminder.telegramUserId,
        `Не забудь: ${reminder.habitName} 💪`
      );

      markReminderSentToday(reminder.habitId, reminder.telegramUserId, now.date);
    }
  });
};
