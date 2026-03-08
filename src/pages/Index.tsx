import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import TradingChart from '@/components/TradingChart';
import SignalCard from '@/components/SignalCard';
import FibLevelsPanel from '@/components/FibLevelsPanel';
import TimeframeSelector from '@/components/TimeframeSelector';
import StatsBar from '@/components/StatsBar';
import { generateMockCandles } from '@/lib/mockData';
import {
  detectSwings,
  findRelevantSwingPair,
  calculateFibonacciLevels,
  generateSignals,
} from '@/lib/fibonacci';
import { Activity } from 'lucide-react';

const Index = () => {
  const [timeframe, setTimeframe] = useState('H1');

  const candles = useMemo(() => generateMockCandles(200, timeframe), [timeframe]);

  const analysis = useMemo(() => {
    const swings = detectSwings(candles, 5);
    const pair = findRelevantSwingPair(swings);
    if (!pair) return null;

    const fibLevels = calculateFibonacciLevels(pair.high.price, pair.low.price);
    const signals = generateSignals(candles, fibLevels, pair.high.price, pair.low.price);

    return { swings, pair, fibLevels, signals };
  }, [candles]);

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

  const handleTimeframeChange = useCallback((tf: string) => setTimeframe(tf), []);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Fibonacci Analyzer
            </h1>
            <p className="text-xs text-muted-foreground">SDC/USDT • Análise Automatizada</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <TimeframeSelector selected={timeframe} onChange={handleTimeframeChange} />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-muted-foreground font-display">DEMO</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 glass rounded-lg px-4 py-3"
      >
        <StatsBar candles={candles} signals={analysis?.signals || []} />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 glass rounded-lg p-2 min-h-[450px]"
        >
          <TradingChart
            candles={candles}
            fibLevels={analysis?.fibLevels || []}
          />
        </motion.div>

        {/* Fib Levels Panel */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {analysis ? (
            <FibLevelsPanel levels={analysis.fibLevels} currentPrice={currentPrice} />
          ) : (
            <div className="glass rounded-lg p-4 text-center text-muted-foreground text-sm">
              Sem dados para análise
            </div>
          )}
        </motion.div>
      </div>

      {/* Signals Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6"
      >
        <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Sinais Gerados
        </h2>

        {analysis && analysis.signals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {analysis.signals.map((signal, i) => (
              <SignalCard key={signal.id} signal={signal} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-lg p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhum sinal identificado no período atual. Aguarde novas confluências.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Index;
