export interface OHLCVCandle {
  time: number; // unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingPoint {
  index: number;
  price: number;
  time: number;
  type: 'high' | 'low';
}

export interface FibonacciLevel {
  level: number;
  label: string;
  price: number;
  type: 'retracement' | 'extension';
}

export interface TradingSignal {
  id: string;
  type: 'long' | 'short';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  fibLevel: string;
  confidence: 'high' | 'medium' | 'low';
  riskReward: number;
  status: 'active' | 'hit_tp' | 'hit_sl' | 'expired';
}

export const RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
export const EXTENSION_LEVELS = [1.272, 1.618, 2.618];

const RETRACEMENT_LABELS: Record<number, string> = {
  0: '0%', 0.236: '23.6%', 0.382: '38.2%', 0.5: '50%',
  0.618: '61.8%', 0.786: '78.6%', 1.0: '100%',
};
const EXTENSION_LABELS: Record<number, string> = {
  1.272: '127.2%', 1.618: '161.8%', 2.618: '261.8%',
};

export function detectSwings(candles: OHLCVCandle[], lookback: number = 5): SwingPoint[] {
  const swings: SwingPoint[] = [];
  if (candles.length < lookback * 2 + 1) return swings;

  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (candles[j].high >= candles[i].high) isHigh = false;
      if (candles[j].low <= candles[i].low) isLow = false;
    }

    if (isHigh) {
      swings.push({ index: i, price: candles[i].high, time: candles[i].time, type: 'high' });
    }
    if (isLow) {
      swings.push({ index: i, price: candles[i].low, time: candles[i].time, type: 'low' });
    }
  }

  return swings;
}

export function findRelevantSwingPair(swings: SwingPoint[]): { high: SwingPoint; low: SwingPoint } | null {
  if (swings.length < 2) return null;

  const recentSwings = swings.slice(-10);
  let bestHigh: SwingPoint | null = null;
  let bestLow: SwingPoint | null = null;

  for (const s of recentSwings) {
    if (s.type === 'high' && (!bestHigh || s.price > bestHigh.price)) bestHigh = s;
    if (s.type === 'low' && (!bestLow || s.price < bestLow.price)) bestLow = s;
  }

  if (!bestHigh || !bestLow) return null;
  return { high: bestHigh, low: bestLow };
}

export function calculateFibonacciLevels(high: number, low: number): FibonacciLevel[] {
  const range = high - low;
  const levels: FibonacciLevel[] = [];

  for (const level of RETRACEMENT_LEVELS) {
    levels.push({
      level,
      label: RETRACEMENT_LABELS[level],
      price: high - range * level,
      type: 'retracement',
    });
  }

  for (const level of EXTENSION_LEVELS) {
    levels.push({
      level,
      label: EXTENSION_LABELS[level],
      price: high - range * level,
      type: 'extension',
    });
  }

  return levels;
}

export function generateSignals(
  candles: OHLCVCandle[],
  fibLevels: FibonacciLevel[],
  swingHigh: number,
  swingLow: number
): TradingSignal[] {
  const signals: TradingSignal[] = [];
  if (candles.length < 3) return signals;

  const recentCandles = candles.slice(-20);
  const tolerance = (swingHigh - swingLow) * 0.005; // 0.5% tolerance

  for (let i = 2; i < recentCandles.length; i++) {
    const candle = recentCandles[i];
    const prev = recentCandles[i - 1];

    for (const fib of fibLevels) {
      if (fib.type !== 'retracement' || fib.level === 0 || fib.level === 1) continue;

      const nearLevel = Math.abs(candle.low - fib.price) < tolerance || Math.abs(candle.close - fib.price) < tolerance;
      if (!nearLevel) continue;

      // Bull signal: price touches fib support and bounces
      if (candle.close > candle.open && prev.close < prev.open && candle.close > fib.price) {
        const levelIdx = fibLevels.findIndex(f => f.level === fib.level);
        const slLevel = fibLevels[Math.min(levelIdx + 1, fibLevels.length - 1)];
        const tpLevel = fibLevels[Math.max(levelIdx - 2, 0)];

        const entry = candle.close;
        const sl = slLevel.price - tolerance;
        const tp = tpLevel.price;
        const rr = Math.abs(tp - entry) / Math.abs(entry - sl);

        if (rr > 1) {
          signals.push({
            id: `sig-${candle.time}-${fib.label}`,
            type: 'long',
            entry,
            stopLoss: sl,
            takeProfit: tp,
            timestamp: candle.time,
            fibLevel: fib.label,
            confidence: fib.level === 0.618 ? 'high' : fib.level === 0.5 ? 'medium' : 'low',
            riskReward: Math.round(rr * 100) / 100,
            status: 'active',
          });
        }
      }

      // Bear signal: price hits fib resistance and drops
      const nearResistance = Math.abs(candle.high - fib.price) < tolerance;
      if (nearResistance && candle.close < candle.open && prev.close > prev.open) {
        const levelIdx = fibLevels.findIndex(f => f.level === fib.level);
        const slLevel = fibLevels[Math.max(levelIdx - 1, 0)];
        const tpLevel = fibLevels[Math.min(levelIdx + 2, fibLevels.length - 1)];

        const entry = candle.close;
        const sl = slLevel.price + tolerance;
        const tp = tpLevel.price;
        const rr = Math.abs(entry - tp) / Math.abs(sl - entry);

        if (rr > 1) {
          signals.push({
            id: `sig-${candle.time}-${fib.label}-short`,
            type: 'short',
            entry,
            stopLoss: sl,
            takeProfit: tp,
            timestamp: candle.time,
            fibLevel: fib.label,
            confidence: fib.level === 0.618 ? 'high' : fib.level === 0.5 ? 'medium' : 'low',
            riskReward: Math.round(rr * 100) / 100,
            status: 'active',
          });
        }
      }
    }
  }

  // Deduplicate by keeping most recent per fib level
  const seen = new Map<string, TradingSignal>();
  for (const s of signals) {
    const key = `${s.type}-${s.fibLevel}`;
    if (!seen.has(key) || s.timestamp > seen.get(key)!.timestamp) {
      seen.set(key, s);
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.timestamp - a.timestamp);
}
