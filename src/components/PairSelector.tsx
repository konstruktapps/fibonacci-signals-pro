interface PairSelectorProps {
  selected: string;
  onChange: (pair: string) => void;
  pairs: string[];
  formatLabel: (s: string) => string;
}

export default function PairSelector({ selected, onChange, pairs, formatLabel }: PairSelectorProps) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="bg-secondary text-secondary-foreground text-xs font-display font-medium rounded px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
    >
      {pairs.map((pair) => (
        <option key={pair} value={pair} className="bg-card text-foreground">
          {formatLabel(pair)}
        </option>
      ))}
    </select>
  );
}
