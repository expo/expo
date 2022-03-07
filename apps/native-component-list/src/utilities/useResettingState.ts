import { useState, useEffect, EffectCallback, DependencyList } from 'react';

const useDelayedEffect = (callback: EffectCallback, deps: DependencyList, delay: number) => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    timeoutId && clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
    return () => timeoutId && clearTimeout(timeoutId);
  }, [callback, delay, ...deps]);
};

export default <T>(value: T | undefined, timeout: number) => {
  const [state, setState] = useState<T | undefined>(value);

  useDelayedEffect(
    () => {
      state !== undefined && setState(undefined);
    },
    [state],
    timeout
  );

  return [state, setState] as const;
};
