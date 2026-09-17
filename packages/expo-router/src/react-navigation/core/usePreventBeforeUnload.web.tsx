import * as React from 'react';

export function usePreventBeforeUnload(preventBeforeUnload: boolean) {
  const isDisabledRef = React.useRef(false);
  const preventUnload = React.useEffectEvent((event: BeforeUnloadEvent) => {
    if (preventBeforeUnload && !isDisabledRef.current) {
      event.preventDefault();
      event.returnValue = true;
    }
  });

  React.useEffect(() => {
    isDisabledRef.current = false;

    if (!preventBeforeUnload) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => preventUnload(event);

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [preventBeforeUnload]);

  return React.useCallback(() => {
    isDisabledRef.current = true;
  }, []);
}
