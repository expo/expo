import { renderHook as tlRenderHook } from '@testing-library/react-native';
import React from 'react';

import { inMemoryContext, MemoryContext } from './context-stubs';
import { ExpoRoot } from '../ExpoRoot';

/*
 * Creates an Expo Router context around the hook, where every router renders the hook
 * This allows you full navigation
 */
export function renderHook<T>(
  renderCallback: () => T,
  routes: string[] = ['index'],
  { initialUrl = '/' }: { initialUrl?: string } = {}
) {
  return tlRenderHook(renderCallback, {
    wrapper: function Wrapper({ children }) {
      const context: MemoryContext = {};
      for (const key of routes) {
        context[key] = () => <>{children}</>;
      }

      return (
        <ExpoRoot
          context={inMemoryContext(context)}
          location={new URL(initialUrl, 'test://test')}
        />
      );
    },
  });
}

export function renderHookOnce<T>(
  renderCallback: () => T,
  routes?: string[],
  options?: { initialUrl?: string }
) {
  return renderHook<T>(renderCallback, routes, options).result.current;
}
