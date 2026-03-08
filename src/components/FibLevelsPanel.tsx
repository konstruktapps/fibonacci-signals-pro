import { FibonacciLevel } from '@/lib/fibonacci';

const FIB_COLOR_CLASS: Record<string, string> = {
  '0%': 'text-fib-0',
  '23.6%': 'text-fib-236',
  '38.2%': 'text-fib-382',
  '50%': 'text-fib-500',
  '61.8%': 'text-fib-618',
  '78.6%': 'text-fib-786',
  '100%': 'text-fib-1000',
  '127.2%': 'text-fib-1272',
  '161.8%': 'text-fib-1618',
  '261.8%': 'text-fib-1618',
};

interface FibLevelsPanelProps {
  levels: FibonacciLevel[];
  currentPrice: number;
}

export default function FibLevelsPanel({ levels, currentPrice }: FibLevelsPanelProps) {
  return (
    <div className="glass rounded-lg p-4">
      <h3 className="font-display text-sm font-semibold text-foreground mb-3">
        Níveis de Fibonacci
      </h3>
      <div className="space-y-1.5">
        {levels.map((level) => {
          const distance = ((level.price - currentPrice) / currentPrice * 100).toFixed(2);
          const isNear = Math.abs(level.price - currentPrice) / currentPrice < 0.01;
          const colorClass = FIB_COLOR_CLASS[level.label] || 'text-muted-foreground';

          return (
            <div
              key={level.label}
              className={`flex items-center justify-between text-xs py-1 px-2 rounded ${
                isNear ? 'bg-primary/10 animate-pulse-glow' : ''
              }`}
            >
              <span className={`font-display font-medium ${colorClass}`}>
                {level.label}
                {level.type === 'extension' && (
                  <span className="text-muted-foreground ml-1">ext</span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-display text-foreground">
                  ${level.price.toFixed(5)}
                </span>
                <span className={`font-display w-16 text-right ${
                  parseFloat(distance) > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {parseFloat(distance) > 0 ? '+' : ''}{distance}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
