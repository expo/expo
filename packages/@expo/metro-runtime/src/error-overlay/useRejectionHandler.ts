import React from 'react';

import ExceptionsManager from './modules/ExceptionsManager';

function useStackTraceLimit(limit: number) {
  const current = React.useRef(0);
  React.useEffect(() => {
    try {
      // @ts-expect-error: StackTraceLimit is not defined in the Error type
      const currentLimit = Error.stackTraceLimit;
      // @ts-expect-error: StackTraceLimit is not defined in the Error type
      Error.stackTraceLimit = limit;
      current.current = currentLimit;
    } catch {}
    return () => {
      try {
        // @ts-expect-error: StackTraceLimit is not defined in the Error type
        Error.stackTraceLimit = current.current;
      } catch {}
    };
  }, [limit]);
}

export function useRejectionHandler() {
  const hasError = React.useRef(false);

  useStackTraceLimit(35);

  React.useEffect(() => {
    function onUnhandledError(ev: ErrorEvent) {
      hasError.current = true;

      const error = ev?.error;
      if (!error || !(error instanceof Error) || typeof error.stack !== 'string') {
        return;
      }

      ExceptionsManager.handleException(error);
    }

    function onUnhandledRejection(ev: PromiseRejectionEvent) {
      hasError.current = true;

      const reason = ev?.reason;
      if (!reason || !(reason instanceof Error) || typeof reason.stack !== 'string') {
        return;
      }

      ExceptionsManager.handleException(reason);
    }

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onUnhandledError);
    return () => {
      window.removeEventListener('error', onUnhandledError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return hasError;
}
