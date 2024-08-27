import { useEffect, type DependencyList } from 'react';

import type { DOMImperativeFactory } from './dom.types';

/**
 * A React `useImperativeHandle` like hook for DOM components.
 *
 */
export function useDomImperativeHandle<T extends DOMImperativeFactory>(
  init: () => T,
  deps?: DependencyList
) {
  useEffect(() => {
    globalThis._domRefProxy = init();
    return () => {
      globalThis._domRefProxy = undefined;
    };
  }, deps);
}
