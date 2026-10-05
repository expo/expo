import { isEnabled } from './enable';
import type { RouterPerformanceMarkByName, RouterPerformanceMarkName } from './types';

// TODO: Use React Native's PerformanceObserver once it preserves mark details, then unify the
// native and web implementations.
export type * from './types';
export { isEnabled, unstable_enablePerformanceIntegration } from './enable';

const MAX_BUFFERED_ENTRIES = 250;

let entries: PerformanceMark[] = [];
const observers = new Map<unstable_PerformanceObserver, PerformanceObserverCallback>();

function createEntryList(list: PerformanceMark[]): PerformanceObserverEntryList {
  return {
    getEntries: () => [...list],
    getEntriesByName: (name: string, type?: string) =>
      type === undefined || type === 'mark' ? list.filter((entry) => entry.name === name) : [],
    getEntriesByType: (type: string) => (type === 'mark' ? [...list] : []),
  };
}

function createMark(name: string, detail: unknown): PerformanceMark {
  const json = { entryType: 'mark', name, startTime: performance.now(), duration: 0, detail };
  return { ...json, toJSON: () => json };
}

function notify(
  observer: unstable_PerformanceObserver,
  callback: PerformanceObserverCallback,
  list: PerformanceObserverEntryList
) {
  try {
    callback(list, observer);
  } catch (error) {
    console.error('[expo-router] An unstable_PerformanceObserver callback threw:', error);
  }
}

export function mark<Name extends RouterPerformanceMarkName>(
  name: Name,
  detail: RouterPerformanceMarkByName<Name>['detail']
) {
  if (!isEnabled()) {
    return;
  }
  const entry = createMark(name, detail);
  entries.push(entry);
  if (entries.length > MAX_BUFFERED_ENTRIES) {
    entries.shift();
  }
  try {
    performance.mark?.(name, { detail, startTime: entry.startTime });
  } catch {
    // `performance.mark` throws for a `detail` that cannot be cloned.
  }
  const list = createEntryList([entry]);
  for (const [observer, callback] of observers) {
    notify(observer, callback, list);
  }
}

/**
 * Reads the performance marks that Expo Router records during navigation. It has the
 * mark-related methods of the global [`performance`](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
 * object. On web, it is the global `performance` object.
 *
 * On native, Expo Router keeps the latest 250 marks. It also passes each mark to the global
 * `performance.mark()`, so the marks show in the React Native DevTools timeline.
 *
 * @experimental
 */
export const unstable_performance: Pick<
  Performance,
  'getEntries' | 'getEntriesByName' | 'getEntriesByType' | 'clearMarks'
> = {
  getEntries: () => [...entries],
  getEntriesByName: (name, type) => createEntryList(entries).getEntriesByName(name, type),
  getEntriesByType: (type) => createEntryList(entries).getEntriesByType(type),
  clearMarks(name) {
    entries = name ? entries.filter((entry) => entry.name !== name) : [];
  },
};

/**
 * Observes the performance marks that Expo Router records during navigation. On web, it is the
 * global [`PerformanceObserver`](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver).
 * On native, it implements the same API for `mark` entries, and the entries keep `detail`.
 *
 * Check the `name` of an entry and cast it to the matching mark type, for example
 * `RouterPageFocusedMark`, to read its `detail`.
 *
 * @example
 * ```ts app/_layout.tsx
 * import {
 *   unstable_enablePerformanceIntegration,
 *   unstable_PerformanceObserver,
 *   type RouterPageFocusedMark,
 * } from 'expo-router';
 *
 * unstable_enablePerformanceIntegration();
 *
 * new unstable_PerformanceObserver((list) => {
 *   for (const entry of list.getEntriesByName('expo-router:page-focused')) {
 *     const { detail } = entry as RouterPageFocusedMark;
 *     console.log(entry.startTime, detail.pathname);
 *   }
 * }).observe({ type: 'mark', buffered: true });
 * ```
 *
 * @experimental
 */
export class unstable_PerformanceObserver implements PerformanceObserver {
  static readonly supportedEntryTypes: readonly string[] = ['mark'];

  constructor(private readonly callback: PerformanceObserverCallback) {}

  /**
   * Starts to observe marks. With `buffered: true`, the callback first receives the marks
   * recorded before this call.
   */
  observe(options?: PerformanceObserverInit) {
    if (options?.type !== 'mark' && !options?.entryTypes?.includes('mark')) {
      return;
    }
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

  /**
   * Always returns an empty list, because the callback receives each mark when it is recorded.
   */
  takeRecords(): PerformanceEntryList {
    return [];
  }
}
