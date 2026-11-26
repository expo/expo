import { createElement } from 'react';
import { View } from 'react-native';

// Records a `(viewName, props)` call for every render of a view returned by
// `requireNativeView`. Cleared automatically between tests (`clearMocks`).
export const renderedNativeViews = jest.fn();

export function findNativeViewProps(viewName: string) {
  const call = renderedNativeViews.mock.calls.find(([name]) => name === viewName);
  return call?.[1];
}

export const requireNativeModule = jest.fn(() => ({
  // The Android `Host` reads the Material palette on render.
  getMaterialColors: jest.fn(() => ({})),
}));

function createMockNativeView(viewName: string) {
  return function MockNativeView(props: Record<string, any>) {
    renderedNativeViews(viewName, props);
    // Swallow string children — the RN mock View can't render raw text.
    const children = typeof props.children === 'string' ? undefined : props.children;
    return createElement(View, { ...props, children });
  };
}

export const requireNativeView = jest.fn((moduleName: string, viewName: string) => {
  return createMockNativeView(viewName);
});

// The package object of `@expo/ui` (`expo.packages['@expo/ui']`) has a mock view for each view name.
export const requireOptionalNative = jest.fn(
  () =>
    new Proxy(
      {},
      {
        get: (_target, name) => (typeof name === 'string' ? createMockNativeView(name) : undefined),
      }
    )
);
