import { renderHook as tlRenderHook } from '@testing-library/react-native';
import React from 'react';

import { ExpoRoot } from '../../exports';
import type { MemoryContext } from '../../testing-library/context-stubs';
import { inMemoryContext } from '../../testing-library/context-stubs';

/*
 * Creates an Expo Router context around the hook, where every router renders the hook
 * This allows you full navigation
 */
export function renderHook<T>(
  renderCallback: () => T,
  routes: string[] = ['index'],
  {
    initialUrl = '/',
    wrapper: RootWrapper,
  }: { initialUrl?: string; wrapper?: React.ComponentType<{ children: React.ReactNode }> } = {}
) {
  return tlRenderHook(renderCallback, {
    wrapper: function Wrapper({ children }) {
      const context: MemoryContext = {};
      for (const key of routes) {
        context[key] = () => <>{children}</>;
      }

      const root = (
        <ExpoRoot
          context={inMemoryContext(context)}
          location={new URL(initialUrl, 'test://test')}
        />
      );

      return RootWrapper ? <RootWrapper>{root}</RootWrapper> : root;
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
