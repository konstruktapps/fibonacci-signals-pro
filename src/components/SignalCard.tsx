import { TradingSignal } from '@/lib/fibonacci';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Target, ShieldAlert } from 'lucide-react';

interface SignalCardProps {
  signal: TradingSignal;
  index: number;
  decimals?: number;
}

export default function SignalCard({ signal, index, decimals = 5 }: SignalCardProps) {
  const isLong = signal.type === 'long';
  const fmt = (v: number) => v.toFixed(decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-lg border p-4 glass ${
        isLong ? 'glow-success' : 'glow-destructive'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLong ? (
            <div className="flex items-center gap-1 text-success font-display text-sm font-semibold">
              <ArrowUpRight className="w-4 h-4" />
              LONG
            </div>
          ) : (
            <div className="flex items-center gap-1 text-destructive font-display text-sm font-semibold">
              <ArrowDownRight className="w-4 h-4" />
              SHORT
            </div>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-display">
            {signal.fibLevel}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          signal.confidence === 'high' ? 'bg-success/20 text-success' :
          signal.confidence === 'medium' ? 'bg-accent/20 text-accent' :
          'bg-muted text-muted-foreground'
        }`}>
          {signal.confidence.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entrada</span>
          <span className="font-display font-medium">{fmt(signal.entry)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Stop Loss
          </span>
          <span className="font-display text-destructive">{fmt(signal.stopLoss)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="w-3 h-3" /> Take Profit
          </span>
          <span className="font-display text-success">{fmt(signal.takeProfit)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-border">
          <span className="text-muted-foreground">R:R</span>
          <span className="font-display font-semibold text-primary">{signal.riskReward}:1</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground font-display">
        {new Date(signal.timestamp * 1000).toLocaleString('pt-BR')}
      </div>
    </motion.div>
  );
}
