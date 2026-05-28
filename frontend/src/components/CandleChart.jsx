import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

// data: [{ time: 'YYYY-MM-DD', open, high, low, close }]
// — backend의 toCandles()가 Alpha Vantage TIME_SERIES_DAILY를 이 형식으로 변환해서 내려줌
export default function CandleChart({ data }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#8b949e',
      },
      grid: {
        vertLines: { color: '#161b22' },
        horzLines: { color: '#161b22' },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: { borderColor: '#30363d' },
      rightPriceScale: { borderColor: '#30363d' },
    });

    const series = chart.addCandlestickSeries({
      upColor:      '#3fb950',
      downColor:    '#f85149',
      borderVisible: false,
      wickUpColor:  '#3fb950',
      wickDownColor:'#f85149',
    });

    series.setData(data);
    chart.timeScale().fitContent();

    const onResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={containerRef} style={{ width: '100%', marginBottom: '16px' }} />;
}
