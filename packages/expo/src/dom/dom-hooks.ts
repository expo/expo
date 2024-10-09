import { useCallback, useEffect, useImperativeHandle, type DependencyList, type Ref } from 'react';

import type { DOMImperativeFactory } from './dom.types';

/**
 * A React `useImperativeHandle` like hook for DOM components.
 *
 */
export function useDOMImperativeHandle<T extends DOMImperativeFactory>(
  ref: Ref<T>,
  init: () => T,
  deps?: DependencyList
) {
  // @ts-expect-error: Added via react-native-webview
  const isTargetWeb = typeof window.ReactNativeWebView === 'undefined';

  const stubHandlerFactory = useCallback(() => ({}) as T, deps ?? []);

  // This standard useImperativeHandle hook is serving for web
  useImperativeHandle(ref, isTargetWeb ? init : stubHandlerFactory, deps);

  // This `globalThis._domRefProxy` is serving for native
  useEffect(() => {
    if (!isTargetWeb) {
      globalThis._domRefProxy = init();
    }
    return () => {
      if (!isTargetWeb) {
        globalThis._domRefProxy = undefined;
      }
    };
  }, deps);
}
