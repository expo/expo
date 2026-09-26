import { render } from '@testing-library/react-native';
import type { ColorSchemeName } from 'react-native';
import * as ReactNative from 'react-native';

export function mockProperty<T, K extends keyof T>(
  obj: T,
  propertyName: K,
  mock: T[K],
  fn: () => void
) {
  const originalValue = obj[propertyName];
  obj[propertyName] = mock;
  try {
    fn();
  } finally {
    obj[propertyName] = originalValue;
  }
}

export async function mockAppearance(colorScheme: ColorSchemeName, fn: () => Promise<void>) {
  const mockUseColorScheme = jest
    .spyOn(ReactNative, 'useColorScheme')
    .mockImplementationOnce(() => colorScheme);
  try {
    await fn();
  } finally {
    mockUseColorScheme.mockRestore();
  }
}

/**
 * Renders `element` and returns the given prop of the React Native `StatusBar` it renders.
 * React Native's `StatusBar` renders nothing, so `mockNativeStatusBar` must be called first to
 * replace it with a host element that carries its props.
 */
export async function renderedPropValue(element: React.ReactElement, prop: string) {
  const result = await render(element);
  return result.root?.props[prop];
}

/**
 * Replaces React Native's `StatusBar` component with a host element that exposes its props.
 * Call this at the top level of a test file, before the component under test is rendered.
 */
export function mockNativeStatusBar() {
  jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => {
    const React = require('react') as typeof import('react');
    return {
      __esModule: true,
      default: (props: Record<string, unknown>) => React.createElement('StatusBar', props),
    };
  });
}
