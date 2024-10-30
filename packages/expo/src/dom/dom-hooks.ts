import { useCallback, useEffect, useImperativeHandle, type DependencyList, type Ref } from 'react';

import type { DOMImperativeFactory } from './dom.types';
import { REGISTER_DOM_IMPERATIVE_HANDLE_PROPS } from './injection';

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
      // @ts-expect-error: Added via react-native-webview
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: REGISTER_DOM_IMPERATIVE_HANDLE_PROPS,
          data: Object.keys(globalThis._domRefProxy),
        })
      );
    }
    return () => {
      if (!isTargetWeb) {
        globalThis._domRefProxy = undefined;
      }
    };
  }, deps);
}
