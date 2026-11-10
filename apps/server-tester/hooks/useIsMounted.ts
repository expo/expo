import { useEffect, useState } from 'react';

/** `false` during server rendering and hydration, `true` after the first client effect. */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
