import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import TradingChart from '@/components/TradingChart';
import SignalCard from '@/components/SignalCard';
import FibLevelsPanel from '@/components/FibLevelsPanel';
import TimeframeSelector from '@/components/TimeframeSelector';
import AssetSelector from '@/components/AssetSelector';
import StatsBar from '@/components/StatsBar';
import { fetchCandles, AVAILABLE_ASSETS, AssetConfig } from '@/lib/binanceApi';
import {
  OHLCVCandle,
  detectSwings,
  findRelevantSwingPair,
  calculateFibonacciLevels,
  generateSignals,
} from '@/lib/fibonacci';
import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const Index = () => {
  const [timeframe, setTimeframe] = useState('H1');
  const [selectedSymbol, setSelectedSymbol] = useState('WDO');
  const [candles, setCandles] = useState<OHLCVCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const asset: AssetConfig = useMemo(
    () => AVAILABLE_ASSETS.find(a => a.symbol === selectedSymbol) || AVAILABLE_ASSETS[0],
    [selectedSymbol]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandles(asset, timeframe, 200);
      setCandles(data);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [asset, timeframe]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const analysis = useMemo(() => {
    if (candles.length === 0) return null;
    const swings = detectSwings(candles, 5);
    const swingPair = findRelevantSwingPair(swings);
    if (!swingPair) return null;

    const fibLevels = calculateFibonacciLevels(swingPair.high.price, swingPair.low.price);
    const signals = generateSignals(candles, fibLevels, swingPair.high.price, swingPair.low.price);

    return { swings, pair: swingPair, fibLevels, signals };
  }, [candles]);

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

  const isMock = asset.source === 'b3-mock';
  const sourceLabel = isMock ? 'B3 (Simulado)' : 'Binance';

  const formatPrice = useCallback((price: number) => {
    return price.toFixed(asset.decimals);
  }, [asset.decimals]);

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
            <p className="text-xs text-muted-foreground">
              {asset.label} • {sourceLabel} • Análise Automatizada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <AssetSelector
            selected={selectedSymbol}
            onChange={setSelectedSymbol}
            assets={AVAILABLE_ASSETS}
          />
          <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5">
            {error ? (
              <WifiOff className="w-3.5 h-3.5 text-destructive" />
            ) : isMock ? (
              <>
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
                <span className="text-xs text-muted-foreground font-display">DEMO</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-muted-foreground font-display">LIVE</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-4 glass rounded-lg px-4 py-3 border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 glass rounded-lg px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <StatsBar candles={candles} signals={analysis?.signals || []} decimals={asset.decimals} currency={asset.currency} />
          {lastUpdate && (
            <span className="text-xs text-muted-foreground font-display hidden lg:block">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 glass rounded-lg p-2 min-h-[450px] relative"
        >
          {loading && candles.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          <TradingChart candles={candles} fibLevels={analysis?.fibLevels || []} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {analysis ? (
            <FibLevelsPanel levels={analysis.fibLevels} currentPrice={currentPrice} decimals={asset.decimals} />
          ) : (
            <div className="glass rounded-lg p-4 text-center text-muted-foreground text-sm">
              {loading ? 'Carregando...' : 'Sem dados para análise'}
            </div>
          )}
        </motion.div>
      </div>

      {/* Signals */}
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
              <SignalCard key={signal.id} signal={signal} index={i} decimals={asset.decimals} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-lg p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {loading ? 'Analisando dados...' : 'Nenhum sinal identificado no período atual.'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Index;
