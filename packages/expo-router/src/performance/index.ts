import type {
  RouterPerformanceMark,
  RouterPerformanceMarkByName,
  RouterPerformanceMarkName,
  RouterPerformanceObserverCallback,
  RouterPerformanceObserverEntryList,
  RouterPerformanceObserverInit,
} from './types';

export type * from './types';

const MAX_BUFFERED_ENTRIES = 250;

let enabled = false;
let entries: RouterPerformanceMark[] = [];
const observers = new Map<unstable_PerformanceObserver, RouterPerformanceObserverCallback>();

function createEntryList(list: RouterPerformanceMark[]): RouterPerformanceObserverEntryList {
  return {
    getEntries: () => [...list],
    getEntriesByName: <Name extends RouterPerformanceMarkName>(name: Name, type?: string) =>
      type === undefined || type === 'mark'
        ? list.filter(
            // The name check narrows each entry to the variant with that name.
            (entry): entry is RouterPerformanceMarkByName<Name> => entry.name === name
          )
        : [],
    getEntriesByType: (type: string) => (type === 'mark' ? [...list] : []),
  };
}

function notify(
  observer: unstable_PerformanceObserver,
  callback: RouterPerformanceObserverCallback,
  list: RouterPerformanceObserverEntryList
) {
  try {
    callback(list, observer);
  } catch (error) {
    console.error('[expo-router] An unstable_PerformanceObserver callback threw:', error);
  }
}

export function isEnabled() {
  return enabled;
}

export function mark<Name extends RouterPerformanceMarkName>(
  name: Name,
  detail: RouterPerformanceMarkByName<Name>['detail']
) {
  if (!enabled) {
    return;
  }
  // `name` selects one variant of the union, so `detail` matches it.
  const entry = {
    entryType: 'mark',
    name,
    startTime: performance.now(),
    duration: 0,
    detail,
  } as RouterPerformanceMark;
  entries.push(entry);
  if (entries.length > MAX_BUFFERED_ENTRIES) {
    entries.shift();
  }
  try {
    performance.mark?.(name, { detail, startTime: entry.startTime });
  } catch {
    // On web, `performance.mark` throws for a `detail` that cannot be cloned.
  }
  const list = createEntryList([entry]);
  for (const [observer, callback] of observers) {
    notify(observer, callback, list);
  }
}

/**
 * Reads the performance marks that Expo Router records during navigation. Its methods match the
 * mark-related methods of the global [`performance`](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
 * object.
 *
 * Expo Router records marks only after `enable()` is called. It keeps the latest 250 marks and
 * also passes each mark to the global `performance.mark()`, when it is available, so the marks
 * show in the browser and React Native DevTools timelines. The 250-mark limit does not apply to
 * these global marks.
 *
 * @experimental
 */
export const unstable_performance = {
  /**
   * Starts recording navigation marks. Call it before the root layout mounts, for example at
   * the top level of the root `_layout` file.
   */
  enable() {
    enabled = true;
  },
  getEntries(): RouterPerformanceMark[] {
    return [...entries];
  },
  getEntriesByName<Name extends RouterPerformanceMarkName>(
    name: Name,
    type?: string
  ): RouterPerformanceMarkByName<Name>[] {
    return createEntryList(entries).getEntriesByName(name, type);
  },
  getEntriesByType(type: string): RouterPerformanceMark[] {
    return createEntryList(entries).getEntriesByType(type);
  },
  /**
   * Removes the recorded marks with the given name, or all recorded marks when no name is given.
   */
  clearMarks(name?: RouterPerformanceMarkName) {
    entries = name ? entries.filter((entry) => entry.name !== name) : [];
  },
};

/**
 * Observes the performance marks that Expo Router records during navigation. It has the same
 * shape as the global [`PerformanceObserver`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver),
 * but its entries keep `detail` on all platforms.
 *
 * > **Note:** Unlike the global `PerformanceObserver`, the callback runs synchronously for each
 * > mark, at the moment Expo Router records it.
 *
 * @example
 * ```ts app/_layout.tsx
 * import { unstable_performance, unstable_PerformanceObserver } from 'expo-router';
 *
 * unstable_performance.enable();
 *
 * new unstable_PerformanceObserver((list) => {
 *   for (const entry of list.getEntriesByName('expo-router:page-focused')) {
 *     console.log(entry.startTime, entry.detail.pathname);
 *   }
 * }).observe({ type: 'mark', buffered: true });
 * ```
 *
 * @experimental
 */
export class unstable_PerformanceObserver {
  constructor(private readonly callback: RouterPerformanceObserverCallback) {}

  /**
   * Starts to observe marks. With `buffered: true`, the callback first receives the marks
   * recorded before this call.
   */
  observe(options: RouterPerformanceObserverInit) {
    observers.set(this, this.callback);
    if (options.buffered && entries.length > 0) {
      notify(this, this.callback, createEntryList([...entries]));
    }
  }

  /**
   * Stops the observer from receiving marks.
   */
  disconnect() {
    observers.delete(this);
  }
}
