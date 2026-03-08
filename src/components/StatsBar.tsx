import { OHLCVCandle, TradingSignal } from '@/lib/fibonacci';
import { TrendingUp, TrendingDown, BarChart3, Zap } from 'lucide-react';

interface StatsBarProps {
  candles: OHLCVCandle[];
  signals: TradingSignal[];
  decimals?: number;
  currency?: string;
}

export default function StatsBar({ candles, signals, decimals = 5, currency = 'USD' }: StatsBarProps) {
  if (candles.length === 0) return null;

  const prefix = currency === 'BRL' ? 'R$ ' : '$';
  const fmt = (v: number) => `${prefix}${v.toFixed(decimals)}`;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = prev ? ((last.close - prev.close) / prev.close * 100) : 0;
  const isUp = change >= 0;

  const high24 = Math.max(...candles.slice(-24).map(c => c.high));
  const low24 = Math.min(...candles.slice(-24).map(c => c.low));
  const vol24 = candles.slice(-24).reduce((s, c) => s + c.volume, 0);

  const longSignals = signals.filter(s => s.type === 'long').length;
  const shortSignals = signals.filter(s => s.type === 'short').length;

  return (
    <div className="flex flex-wrap gap-4 lg:gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Preço</span>
        <span className="font-display font-bold text-lg text-foreground">
          {fmt(last.close)}
        </span>
        <span className={`flex items-center gap-0.5 font-display text-xs font-medium ${
          isUp ? 'text-success' : 'text-destructive'
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>

      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">High:</span>
        <span className="font-display text-success">{fmt(high24)}</span>
      </div>

      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">Low:</span>
        <span className="font-display text-destructive">{fmt(low24)}</span>
      </div>

      <div className="flex items-center gap-1 text-xs">
        <BarChart3 className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">Vol:</span>
        <span className="font-display text-foreground">{(vol24 / 1000).toFixed(0)}K</span>
      </div>

      <div className="flex items-center gap-1 text-xs">
        <Zap className="w-3 h-3 text-accent" />
        <span className="text-muted-foreground">Sinais:</span>
        <span className="font-display text-success">{longSignals}L</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-display text-destructive">{shortSignals}S</span>
      </div>
    </div>
  );
}
