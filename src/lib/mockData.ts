import { OHLCVCandle } from './fibonacci';

// Generate realistic SDC/USDT mock data with trends
export function generateMockCandles(count: number = 200, timeframe: string = 'H1'): OHLCVCandle[] {
  const now = Math.floor(Date.now() / 1000);
  const intervals: Record<string, number> = {
    M5: 300, M15: 900, H1: 3600, H4: 14400, D1: 86400,
  };
  const interval = intervals[timeframe] || 3600;

  const candles: OHLCVCandle[] = [];
  let price = 0.045 + Math.random() * 0.01; // SDC starts around $0.045-0.055

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * interval;
    
    // Create trending behavior with fibonacci-like retracements
    const trend = Math.sin(i / 30) * 0.003 + Math.sin(i / 80) * 0.005;
    const volatility = 0.001 + Math.random() * 0.002;
    
    const change = trend + (Math.random() - 0.48) * volatility;
    price = Math.max(0.01, price + change);

    const open = price;
    const bodySize = (Math.random() - 0.5) * volatility * 2;
    const close = open + bodySize;
    const wickUp = Math.random() * volatility * 0.8;
    const wickDown = Math.random() * volatility * 0.8;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = 50000 + Math.random() * 200000;

    candles.push({
      time,
      open: Math.round(open * 100000) / 100000,
      high: Math.round(high * 100000) / 100000,
      low: Math.round(low * 100000) / 100000,
      close: Math.round(close * 100000) / 100000,
      volume: Math.round(volume),
    });

    price = close;
  }

  return candles;
}
