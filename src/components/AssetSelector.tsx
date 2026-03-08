import { AssetConfig } from '@/lib/binanceApi';

interface AssetSelectorProps {
  selected: string;
  onChange: (symbol: string) => void;
  assets: AssetConfig[];
}

export default function AssetSelector({ selected, onChange, assets }: AssetSelectorProps) {
  const b3Assets = assets.filter(a => a.category === 'b3-futures');
  const cryptoAssets = assets.filter(a => a.category === 'crypto');

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="bg-secondary text-secondary-foreground text-xs font-display font-medium rounded px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
    >
      <optgroup label="🇧🇷 B3 Futuros" className="bg-card text-foreground">
        {b3Assets.map((a) => (
          <option key={a.symbol} value={a.symbol}>{a.label}</option>
        ))}
      </optgroup>
      <optgroup label="₿ Crypto (Binance)" className="bg-card text-foreground">
        {cryptoAssets.map((a) => (
          <option key={a.symbol} value={a.symbol}>{a.label}</option>
        ))}
      </optgroup>
    </select>
  );
}
