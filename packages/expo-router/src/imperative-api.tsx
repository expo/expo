import { useEffect } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { flushPreReadyActions } from './global-state/routingQueue';

export type { ImperativeRouter };
export { router };

// Drains any imperative-API call made before the container was ready. Runs after every container
// commit; `flushPreReadyActions` is a cheap no-op when the buffer is empty or the ref isn't attached.
// In the common case the root layout renders a navigator on its first render, so the container is
// ready by its first commit and this mount-time run drains the buffer.
export function useFlushPreReadyActions() {
  useEffect(() => {
    flushPreReadyActions();
  });
  return null;
}
