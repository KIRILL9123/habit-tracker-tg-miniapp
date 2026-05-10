type ProgressBarProps = {
  completed: number;
  total: number;
};

export const ProgressBar = ({ completed, total }: ProgressBarProps) => {
  const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-tg-text">Прогресс дня</h2>
        <span className="text-sm text-muted">
          {completed}/{total}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-tg-button transition-all duration-300"
          style={{ width: `${ratio}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{ratio}% выполнено</p>
    </section>
  );
};
