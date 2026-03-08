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

export const AVAILABLE_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
];

export function formatPairLabel(symbol: string): string {
  const base = symbol.replace('USDT', '');
  return `${base}/USDT`;
}
