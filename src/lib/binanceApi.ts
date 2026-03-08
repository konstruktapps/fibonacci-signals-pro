import { OHLCVCandle } from './fibonacci';

const BINANCE_BASE = 'https://api.binance.com/api/v3';
const AWESOME_API_BASE = 'https://economia.awesomeapi.com.br/json';

const TIMEFRAME_MAP: Record<string, string> = {
  M5: '5m',
  M15: '15m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
};

// AwesomeAPI days mapping per timeframe (daily data only)
const AWESOME_DAYS_MAP: Record<string, number> = {
  M5: 15,
  M15: 30,
  H1: 60,
  H4: 120,
  D1: 200,
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

// Fetch USD/BRL daily data from AwesomeAPI (free, no auth)
// WDO = USD/BRL * 1000, DOL = USD/BRL * 1000
export async function fetchAwesomeApiCandles(
  symbol: string,
  timeframe: string
): Promise<OHLCVCandle[]> {
  const days = AWESOME_DAYS_MAP[timeframe] || 60;
  const url = `${AWESOME_API_BASE}/daily/USD-BRL/${days}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`AwesomeAPI error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Sem dados de USD/BRL disponíveis');
  }

  // Multiplier: WDO/DOL are quoted as BRL per USD*1000
  const multiplier = 1000;

  // Data comes newest first, reverse for chronological order
  const candles: OHLCVCandle[] = data
    .map((d: any) => ({
      time: parseInt(d.timestamp),
      open: parseFloat(d.bid) * multiplier, // bid as approximate open
      high: parseFloat(d.high) * multiplier,
      low: parseFloat(d.low) * multiplier,
      close: parseFloat(d.bid) * multiplier,
      volume: 0, // AwesomeAPI doesn't provide volume
    }))
    .reverse();

  return candles;
}

export interface AssetConfig {
  symbol: string;
  label: string;
  source: 'binance' | 'awesome-api';
  category: 'crypto' | 'b3-futures';
  decimals: number;
  currency: string;
}

export const AVAILABLE_ASSETS: AssetConfig[] = [
  // B3 Futuros (via AwesomeAPI USD/BRL)
  { symbol: 'WDO', label: 'Mini Dólar (WDO)', source: 'awesome-api', category: 'b3-futures', decimals: 1, currency: 'BRL' },
  { symbol: 'DOL', label: 'Dólar Futuro (DOL)', source: 'awesome-api', category: 'b3-futures', decimals: 1, currency: 'BRL' },
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
  return fetchAwesomeApiCandles(asset.symbol, timeframe);
}
