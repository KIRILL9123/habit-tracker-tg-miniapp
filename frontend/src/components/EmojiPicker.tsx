type EmojiPickerProps = {
  value: string;
  onSelect: (emoji: string) => void;
};

const DEFAULT_EMOJIS = [
  "💪",
  "🏃",
  "🧘",
  "📚",
  "💧",
  "🥗",
  "🦷",
  "😴",
  "🧠",
  "📝",
  "🎯",
  "🚶",
  "🍎",
  "☀️",
  "🧴",
  "💊",
  "📵",
  "🎸",
  "🧹",
  "🧑‍💻",
  "🛏️",
  "🧎",
  "🍵",
  "🚰",
  "🙏",
  "🎨",
  "📖",
  "🏋️",
  "🥕",
  "🧩",
];

export const EmojiPicker = ({ value, onSelect }: EmojiPickerProps) => {
  return (
    <div className="grid grid-cols-10 gap-2 rounded-xl2 bg-black/10 p-2">
      {DEFAULT_EMOJIS.map((emoji) => {
        const selected = emoji === value;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className={`h-9 w-9 rounded-lg text-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tg-button ${
              selected
                ? "bg-tg-button text-tg-buttonText shadow-md"
                : "bg-transparent hover:bg-white/10"
            }`}
            aria-label={`Выбрать ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};
