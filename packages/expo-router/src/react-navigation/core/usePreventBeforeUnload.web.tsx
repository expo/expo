import { useCallback, useEffect, useEffectEvent, useRef } from 'react';

export function usePreventBeforeUnload(preventBeforeUnload: boolean) {
  const isDisabledRef = useRef(false);
  const preventUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (preventBeforeUnload && !isDisabledRef.current) {
      event.preventDefault();
      event.returnValue = true;
    }
  });

  useEffect(() => {
    isDisabledRef.current = false;

    if (!preventBeforeUnload) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => preventUnload(event);

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [preventBeforeUnload]);

  return useCallback(() => {
    isDisabledRef.current = true;
  }, []);
}
