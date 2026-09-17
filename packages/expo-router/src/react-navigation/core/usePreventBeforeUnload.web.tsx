import * as React from 'react';

export function usePreventBeforeUnload(preventBeforeUnload: boolean) {
  const preventBeforeUnloadRef = React.useRef(preventBeforeUnload);

  React.useEffect(() => {
    preventBeforeUnloadRef.current = preventBeforeUnload;

    if (!preventBeforeUnload) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (preventBeforeUnloadRef.current) {
        event.preventDefault();
        event.returnValue = true;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [preventBeforeUnload]);

  return React.useCallback(() => {
    preventBeforeUnloadRef.current = false;
  }, []);
}
