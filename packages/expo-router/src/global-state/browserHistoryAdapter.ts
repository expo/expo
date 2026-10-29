// Based on React Navigation's `createMemoryHistory`.
// https://github.com/react-navigation/react-navigation/blob/main/packages/native/src/createMemoryHistory.tsx
import type {
  BrowserHistoryAdapter,
  BrowserHistoryChange,
  BrowserHistoryEvent,
} from './browserHistory.types';

function readChange(): BrowserHistoryChange {
  const id = window.history.state?.id;
  const { pathname, search, hash } = window.location;
  return { id: typeof id === 'string' ? id : null, path: pathname + search + hash };
}

/**
 * Connects reducer-generated history events to `window.history`. It applies commands in order and
 * reports browser-initiated back, forward, and hash changes to the navigation reducer.
 */
export function createBrowserHistoryAdapter(): BrowserHistoryAdapter {
  // Pending callbacks for `history.go(n)`.
  const pending: (() => void)[] = [];

  const push = (id: string, path: string) => {
    // The browser is already on this entry when React replays a batch after an urgent update.
    if (window.history.state?.id === id) {
      // The replay may resolve to a different URL for the same entry. Replace updates that URL
      // without adding a duplicate; returning here would keep the earlier URL.
      window.history.replaceState({ id }, '', path);
      return;
    }
    // The state object only holds an id: browsers limit its size and the navigation state may hold
    // non-serializable values.
    window.history.pushState({ id }, '', path);
  };

  const replace = (id: string, path: string) => {
    window.history.replaceState({ id }, '', path);
  };

  // `history.go(n)` is asynchronous, there are a couple of things to keep in mind:
  // - it won't do anything if we can't go `n` steps, the `popstate` event won't fire.
  // - each `history.go(n)` call will trigger a separate `popstate` event with correct location.
  // - the `popstate` event fires before the next frame after calling `history.go(n)`.
  const go = (n: number) => {
    if (n === 0) {
      return Promise.resolve();
    }

    // When we call `history.go`, `popstate` will fire when there's history to go back to
    // So we need to somehow handle following cases:
    // - There's history to go back, `history.go` is called, and `popstate` fires
    // - No history to go back, but `history.go` was called, browser has no API to detect it
    return new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        window.removeEventListener('popstate', onPopState);
        const index = pending.indexOf(done);
        if (index > -1) {
          pending.splice(index, 1);
        }

        resolve();
      };

      pending.push(done);

      // If navigation didn't happen within 100ms, assume that it won't happen
      // This may not be accurate, but hopefully it won't take so much time
      // In Chrome, navigation seems to happen instantly in next microtask
      // But on Firefox, it seems to take much longer, around 50ms from our testing
      // We're using a hacky timeout since there doesn't seem to be way to know for sure
      const timer = setTimeout(done, 100);
      const onPopState = () => done();

      window.addEventListener('popstate', onPopState);
      window.history.go(n);
    });
  };

  // Commands run one after another because `go` is asynchronous.
  let queue = Promise.resolve();
  const apply = (event: BrowserHistoryEvent) => {
    queue = queue.then(() => {
      switch (event.op) {
        case 'push':
          push(event.entryId, event.path);
          return undefined;
        case 'replace':
          replace(event.entryId, event.path);
          return undefined;
        case 'go':
          return go(event.delta);
      }
    });
  };

  // Browsers emit `popstate` when selecting a history entry, including Back/Forward and `go`.
  // `pushState` and `replaceState` only write an entry; the browser API emits no `popstate` for them.
  // Ignore our own `go` calls so their already-reduced navigation is not applied a second time.
  const listen = (listener: (change: BrowserHistoryChange) => void) => {
    const onPopState = () => {
      if (pending.length) {
        // This was triggered by `history.go(n)`, we shouldn't call the listener
        return;
      }

      listener(readChange());
    };

    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  };

  return { apply, listen };
}
