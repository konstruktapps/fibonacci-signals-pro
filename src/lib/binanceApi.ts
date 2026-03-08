import { OHLCVCandle } from './fibonacci';

const BINANCE_BASE = 'https://api.binance.com/api/v3';
const BRAPI_BASE = 'https://brapi.dev/api';

const TIMEFRAME_MAP: Record<string, string> = {
  M5: '5m',
  M15: '15m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
};

// brapi.dev range+interval mapping
const BRAPI_TIMEFRAME_MAP: Record<string, { range: string; interval: string }> = {
  M5: { range: '1d', interval: '5m' },
  M15: { range: '5d', interval: '15m' },
  H1: { range: '1mo', interval: '1h' },
  H4: { range: '3mo', interval: '1d' }, // brapi doesn't have 4h, use 1d as fallback
  D1: { range: '6mo', interval: '1d' },
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

export async function fetchBrapiCandles(
  symbol: string,
  timeframe: string
): Promise<OHLCVCandle[]> {
  const token = import.meta.env.VITE_BRAPI_TOKEN;
  if (!token) {
    throw new Error('Token brapi.dev não configurado (VITE_BRAPI_TOKEN)');
  }

  const tf = BRAPI_TIMEFRAME_MAP[timeframe] || BRAPI_TIMEFRAME_MAP['H1'];
  const url = `${BRAPI_BASE}/quote/${symbol}?range=${tf.range}&interval=${tf.interval}&token=${token}`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Ticker "${symbol}" não encontrado na brapi.dev`);
    }
    if (response.status === 401) {
      throw new Error('Token brapi.dev inválido ou expirado');
    }
    if (response.status === 402) {
      throw new Error('Limite de requisições brapi.dev excedido');
    }
    throw new Error(`brapi.dev API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.results?.[0];

  if (!result || !result.historicalDataPrice || result.historicalDataPrice.length === 0) {
    throw new Error(`Sem dados históricos para "${symbol}" no período selecionado`);
  }

  return result.historicalDataPrice.map((h: any) => ({
    time: h.date,
    open: h.open,
    high: h.high,
    low: h.low,
    close: h.close,
    volume: h.volume || 0,
  }));
}

export interface AssetConfig {
  symbol: string;
  label: string;
  source: 'binance' | 'brapi';
  category: 'crypto' | 'b3-futures';
  decimals: number;
  currency: string;
}

export const AVAILABLE_ASSETS: AssetConfig[] = [
  // B3 Futuros (brapi.dev)
  { symbol: 'WDOFUT', label: 'Mini Dólar (WDO)', source: 'brapi', category: 'b3-futures', decimals: 2, currency: 'BRL' },
  { symbol: 'DOLFUT', label: 'Dólar Futuro (DOL)', source: 'brapi', category: 'b3-futures', decimals: 2, currency: 'BRL' },
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
  return fetchBrapiCandles(asset.symbol, timeframe);
}
