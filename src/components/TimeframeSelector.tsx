interface TimeframeSelectorProps {
  selected: string;
  onChange: (tf: string) => void;
}

const TIMEFRAMES = ['M5', 'M15', 'H1', 'H4', 'D1'];

export default function TimeframeSelector({ selected, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-3 py-1.5 text-xs font-display font-medium rounded transition-all ${
            selected === tf
              ? 'bg-primary text-primary-foreground glow-primary'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
