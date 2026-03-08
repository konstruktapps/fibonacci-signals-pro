import { OHLCVCandle } from './fibonacci';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

const TIMEFRAME_MAP: Record<string, string> = {
  M5: '5m',
  M15: '15m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
};

export async function fetchBinanceCandles(
  symbol: string,
  timeframe: string,
  limit: number = 200
): Promise<OHLCVCandle[]> {
  const interval = TIMEFRAME_MAP[timeframe] || '1h';
  const url = `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data = await response.json();

  return data.map((k: any[]) => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// Mock data for B3 futures (no free public API)
export function generateB3MockCandles(
  symbol: string,
  timeframe: string,
  count: number = 200
): OHLCVCandle[] {
  const now = Math.floor(Date.now() / 1000);
  const intervals: Record<string, number> = {
    M5: 300, M15: 900, H1: 3600, H4: 14400, D1: 86400,
  };
  const interval = intervals[timeframe] || 3600;

  // WDO ~5800 pts, DOL ~5800 pts (same underlying, different contract size)
  const basePrice = symbol === 'WDO' ? 5780 : 5780;
  const tickSize = 0.5; // B3 mini dólar tick
  const candles: OHLCVCandle[] = [];
  let price = basePrice + (Math.random() - 0.5) * 50;

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * interval;

    // Simulate B3 trading hours (skip weekends roughly)
    const trend = Math.sin(i / 25) * 8 + Math.sin(i / 60) * 15;
    const volatility = 3 + Math.random() * 6;

    const change = trend * 0.1 + (Math.random() - 0.48) * volatility;
    price = Math.max(basePrice - 200, Math.min(basePrice + 200, price + change));

    // Round to tick size
    const roundToTick = (v: number) => Math.round(v / tickSize) * tickSize;

    const open = roundToTick(price);
    const bodySize = (Math.random() - 0.5) * volatility * 1.5;
    const close = roundToTick(open + bodySize);
    const wickUp = Math.random() * volatility * 0.6;
    const wickDown = Math.random() * volatility * 0.6;
    const high = roundToTick(Math.max(open, close) + wickUp);
    const low = roundToTick(Math.min(open, close) - wickDown);
    const volume = Math.round(5000 + Math.random() * 30000);

    candles.push({ time, open, high, low, close, volume });
    price = close;
  }

  return candles;
}

export interface AssetConfig {
  symbol: string;
  label: string;
  source: 'binance' | 'b3-mock';
  category: 'crypto' | 'b3-futures';
  decimals: number;
  currency: string;
}

export const AVAILABLE_ASSETS: AssetConfig[] = [
  // B3 Futuros
  { symbol: 'WDO', label: 'Mini Dólar (WDO)', source: 'b3-mock', category: 'b3-futures', decimals: 1, currency: 'BRL' },
  { symbol: 'DOL', label: 'Dólar Futuro (DOL)', source: 'b3-mock', category: 'b3-futures', decimals: 1, currency: 'BRL' },
  // Crypto
  { symbol: 'BTCUSDT', label: 'BTC/USDT', source: 'binance', category: 'crypto', decimals: 2, currency: 'USD' },
  { symbol: 'ETHUSDT', label: 'ETH/USDT', source: 'binance', category: 'crypto', decimals: 2, currency: 'USD' },
  { symbol: 'SOLUSDT', label: 'SOL/USDT', source: 'binance', category: 'crypto', decimals: 4, currency: 'USD' },
  { symbol: 'BNBUSDT', label: 'BNB/USDT', source: 'binance', category: 'crypto', decimals: 2, currency: 'USD' },
  { symbol: 'XRPUSDT', label: 'XRP/USDT', source: 'binance', category: 'crypto', decimals: 5, currency: 'USD' },
  { symbol: 'DOGEUSDT', label: 'DOGE/USDT', source: 'binance', category: 'crypto', decimals: 6, currency: 'USD' },
  { symbol: 'ADAUSDT', label: 'ADA/USDT', source: 'binance', category: 'crypto', decimals: 5, currency: 'USD' },
  { symbol: 'AVAXUSDT', label: 'AVAX/USDT', source: 'binance', category: 'crypto', decimals: 4, currency: 'USD' },
];

export async function fetchCandles(
  asset: AssetConfig,
  timeframe: string,
  limit: number = 200
): Promise<OHLCVCandle[]> {
  if (asset.source === 'binance') {
    return fetchBinanceCandles(asset.symbol, timeframe, limit);
  }
  // B3 mock
  return generateB3MockCandles(asset.symbol, timeframe, limit);
}
