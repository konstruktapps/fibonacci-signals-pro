import { useEffect, useRef, memo } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts';
import { OHLCVCandle, FibonacciLevel } from '@/lib/fibonacci';

interface TradingChartProps {
  candles: OHLCVCandle[];
  fibLevels: FibonacciLevel[];
}

const FIB_COLORS: Record<string, string> = {
  '0%': '#22d3ee',
  '23.6%': '#3b82f6',
  '38.2%': '#a855f7',
  '50%': '#eab308',
  '61.8%': '#f97316',
  '78.6%': '#ef4444',
  '100%': '#ec4899',
  '127.2%': '#c084fc',
  '161.8%': '#38bdf8',
  '261.8%': '#34d399',
};

const TradingChart = memo(({ candles, fibLevels }: TradingChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#6b7a8d',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(42, 52, 68, 0.5)' },
        horzLines: { color: 'rgba(42, 52, 68, 0.5)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(34, 211, 238, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(34, 211, 238, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 52, 68, 0.8)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(42, 52, 68, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const data: CandlestickData[] = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Update fib levels
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    // Remove old lines
    for (const series of lineSeriesRefs.current) {
      chartRef.current.removeSeries(series);
    }
    lineSeriesRefs.current = [];

    const startTime = candles[0].time as Time;
    const endTime = candles[candles.length - 1].time as Time;

    for (const fib of fibLevels) {
      const color = FIB_COLORS[fib.label] || '#6b7a8d';
      const lineSeries = chartRef.current.addLineSeries({
        color,
        lineWidth: 1,
        lineStyle: fib.type === 'extension' ? 2 : 0,
        priceLineVisible: false,
        lastValueVisible: true,
        title: fib.label,
      });

      const lineData: LineData[] = [
        { time: startTime, value: fib.price },
        { time: endTime, value: fib.price },
      ];

      lineSeries.setData(lineData);
      lineSeriesRefs.current.push(lineSeries);
    }
  }, [fibLevels, candles]);

  return (
    <div className="w-full h-full min-h-[400px]" ref={containerRef} />
  );
});

TradingChart.displayName = 'TradingChart';
export default TradingChart;
