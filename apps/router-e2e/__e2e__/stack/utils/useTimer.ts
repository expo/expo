import { useEffect, useRef, useState } from 'react';

export function useTimer(precision: number = 1000): number {
  const startTime = useRef(Date.now());
  const [time, setTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.floor((Date.now() - startTime.current) / precision));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return time;
}
