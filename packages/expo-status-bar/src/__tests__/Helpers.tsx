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

export async function renderedPropValue(element: React.ReactElement, prop: string) {
  const result = await render(element);
  return result.root?.props[prop];
}

export function mockNativeStatusBar() {
  jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => {
    const React = require('react') as typeof import('react');
    return {
      __esModule: true,
      default: (props: Record<string, unknown>) => React.createElement('StatusBar', props),
    };
  });
}
