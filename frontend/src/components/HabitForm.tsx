import { useMemo, useState, type FormEvent } from "react";
import type { NewHabitInput } from "../types";
import { EmojiPicker } from "./EmojiPicker";

type HabitFormProps = {
  onSubmit: (payload: NewHabitInput) => Promise<void>;
  onCancel: () => void;
};

export const HabitForm = ({ onSubmit, onCancel }: HabitFormProps) => {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💪");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameError = useMemo(() => {
    if (!name.trim()) {
      return "Название обязательно";
    }

    if (name.trim().length < 2) {
      return "Минимум 2 символа";
    }

    return null;
  }, [name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (nameError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        emoji,
        reminderTime,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-4">
      <h2 className="text-lg font-semibold tracking-tight text-tg-text">
        Новая привычка
      </h2>

      <label className="block space-y-1">
        <span className="text-sm text-muted">Название</span>
        <input
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Например: Выпить воду"
          className="input-clean"
        />
        {name.length > 0 && nameError && (
          <p className="text-xs text-tg-destructive">{nameError}</p>
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-muted">Время напоминания</span>
        <input
          type="time"
          value={reminderTime}
          onChange={(event) => setReminderTime(event.target.value)}
          className="input-clean"
        />
      </label>

      <div className="space-y-1">
        <span className="text-sm text-muted">Иконка</span>
        <EmojiPicker value={emoji} onSelect={setEmoji} />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/10"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting || Boolean(nameError)}
          className="btn-primary px-4 py-2 text-sm"
        >
          {isSubmitting ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>
    </form>
  );
};
