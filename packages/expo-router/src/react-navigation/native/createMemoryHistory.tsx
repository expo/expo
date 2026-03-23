import type { NavigationState } from '@react-navigation/core';
import { nanoid } from 'nanoid/non-secure';

type HistoryRecord = {
  // Unique identifier for this record to match it with window.history.state
  id: string;
  // Navigation state object for the history entry
  state: NavigationState;
  // Path of the history entry
  path: string;
};

export function createMemoryHistory() {
  let index = 0;
  let items: HistoryRecord[] = [];

  // Pending callbacks for `history.go(n)`
  // We might modify the callback stored if it was interrupted, so we have a ref to identify it
  const pending: { ref: unknown; cb: (interrupted?: boolean) => void }[] = [];

  const interrupt = () => {
    // If another history operation was performed we need to interrupt existing ones
    // This makes sure that calls such as `history.replace` after `history.go` don't happen
    // Since otherwise it won't be correct if something else has changed
    pending.forEach((it) => {
      const cb = it.cb;
      it.cb = () => cb(true);
    });
  };

  const history = {
    get index(): number {
      // We store an id in the state instead of an index
      // Index could get out of sync with in-memory values if page reloads
      const id = window.history.state?.id;

      if (id) {
        const index = items.findIndex((item) => item.id === id);

        return index > -1 ? index : 0;
      }

      return 0;
    },

    get(index: number) {
      return items[index];
    },

    backIndex({ path }: { path: string }) {
      // We need to find the index from the element before current to get closest path to go back to
      for (let i = index - 1; i >= 0; i--) {
        const item = items[i];

        if (item.path === path) {
          return i;
        }
      }

      return -1;
    },

    push({ path, state }: { path: string; state: NavigationState }) {
      interrupt();

      const id = nanoid();

      // When a new entry is pushed, all the existing entries after index will be inaccessible
      // So we remove any existing entries after the current index to clean them up
      items = items.slice(0, index + 1);

      items.push({ path, state, id });
      index = items.length - 1;

      // We pass empty string for title because it's ignored in all browsers except safari
      // We don't store state object in history.state because:
      // - browsers have limits on how big it can be, and we don't control the size
      // - while not recommended, there could be non-serializable data in state
      window.history.pushState({ id }, '', path);
    },

    replace({ path, state }: { path: string; state: NavigationState }) {
      interrupt();

      const id = window.history.state?.id ?? nanoid();

      // Need to keep the hash part of the path if there was no previous history entry
      // or the previous history entry had the same path
      let pathWithHash = path;
      const hash = pathWithHash.includes('#') ? '' : location.hash;

      if (!items.length || items.findIndex((item) => item.id === id) < 0) {
        // There are two scenarios for creating an array with only one history record:
        // - When loaded id not found in the items array, this function by default will replace
        //   the first item. We need to keep only the new updated object, otherwise it will break
        //   the page when navigating forward in history.
        // - This is the first time any state modifications are done
        //   So we need to push the entry as there's nothing to replace

        pathWithHash = pathWithHash + hash;
        items = [{ path: pathWithHash, state, id }];
        index = 0;
      } else {
        if (items[index].path === path) {
          pathWithHash = pathWithHash + hash;
        }
        items[index] = { path, state, id };
      }

      window.history.replaceState({ id }, '', pathWithHash);
    },

    // `history.go(n)` is asynchronous, there are couple of things to keep in mind:
    // - it won't do anything if we can't go `n` steps, the `popstate` event won't fire.
    // - each `history.go(n)` call will trigger a separate `popstate` event with correct location.
    // - the `popstate` event fires before the next frame after calling `history.go(n)`.
    // This method differs from `history.go(n)` in the sense that it'll go back as many steps it can.
    go(n: number) {
      interrupt();

      // To guard against unexpected navigation out of the app we will assume that browser history is only as deep as the length of our memory
      // history. If we don't have an item to navigate to then update our index and navigate as far as we can without taking the user out of the app.
      const nextIndex = index + n;
      const lastItemIndex = items.length - 1;
      if (n < 0 && !items[nextIndex]) {
        // Attempted to navigate beyond the first index. Negating the current index will align the browser history with the first item.
        n = -index;
        index = 0;
      } else if (n > 0 && nextIndex > lastItemIndex) {
        // Attempted to navigate past the last index. Calculate how many indices away from the last index and go there.
        n = lastItemIndex - index;
        index = lastItemIndex;
      } else {
        index = nextIndex;
      }

      if (n === 0) {
        return;
      }

      // When we call `history.go`, `popstate` will fire when there's history to go back to
      // So we need to somehow handle following cases:
      // - There's history to go back, `history.go` is called, and `popstate` fires
      // - `history.go` is called multiple times, we need to resolve on respective `popstate`
      // - No history to go back, but `history.go` was called, browser has no API to detect it
      return new Promise<void>((resolve, reject) => {
        const done = (interrupted?: boolean) => {
          clearTimeout(timer);

          if (interrupted) {
            reject(new Error('History was changed during navigation.'));
            return;
          }

          // There seems to be a bug in Chrome regarding updating the title
          // If we set a title just before calling `history.go`, the title gets lost
          // However the value of `document.title` is still what we set it to
          // It's just not displayed in the tab bar
          // To update the tab bar, we need to reset the title to something else first (e.g. '')
          // And set the title to what it was before so it gets applied
          // It won't work without setting it to empty string coz otherwise title isn't changing
          // Which means that the browser won't do anything after setting the title
          const { title } = window.document;

          window.document.title = '';
          window.document.title = title;

          resolve();
        };

        pending.push({ ref: done, cb: done });

        // If navigation didn't happen within 100ms, assume that it won't happen
        // This may not be accurate, but hopefully it won't take so much time
        // In Chrome, navigation seems to happen instantly in next microtask
        // But on Firefox, it seems to take much longer, around 50ms from our testing
        // We're using a hacky timeout since there doesn't seem to be way to know for sure
        const timer = setTimeout(() => {
          const foundIndex = pending.findIndex((it) => it.ref === done);

          if (foundIndex > -1) {
            pending[foundIndex].cb();
            pending.splice(foundIndex, 1);
          }

          index = this.index;
        }, 100);

        const onPopState = () => {
          // Fix createMemoryHistory.index variable's value
          // as it may go out of sync when navigating in the browser.
          index = this.index;

          const last = pending.pop();

          window.removeEventListener('popstate', onPopState);
          last?.cb();
        };

        window.addEventListener('popstate', onPopState);
        window.history.go(n);
      });
    },

    // The `popstate` event is triggered when history changes, except `pushState` and `replaceState`
    // If we call `history.go(n)` ourselves, we don't want it to trigger the listener
    // Here we normalize it so that only external changes (e.g. user pressing back/forward) trigger the listener
    listen(listener: () => void) {
      const onPopState = () => {
        // Fix createMemoryHistory.index variable's value
        // as it may go out of sync when navigating in the browser.
        index = this.index;

        if (pending.length) {
          // This was triggered by `history.go(n)`, we shouldn't call the listener
          return;
        }

        listener();
      };

      window.addEventListener('popstate', onPopState);

      return () => window.removeEventListener('popstate', onPopState);
    },
  };

  return history;
}
