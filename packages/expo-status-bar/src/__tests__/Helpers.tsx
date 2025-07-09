import { render } from '@testing-library/react-native';
import { type ColorSchemeName } from 'react-native';
import * as ReactNative from 'react-native';

export function mockProperty(obj, propertyName, mock, fn: any) {
  const originalValue = obj[propertyName];
  obj[propertyName] = mock;
  try {
    fn();
  } finally {
    obj[propertyName] = originalValue;
  }
}

export function mockAppearance(colorScheme: ColorSchemeName, fn: any) {
  const mockUseColorScheme = jest
    .spyOn(ReactNative, 'useColorScheme')
    .mockImplementationOnce(() => colorScheme);
  try {
    fn();
  } finally {
  }
  mockUseColorScheme.mockRestore();
}

export function renderedPropValue(element: any, prop: string) {
  const result = render(element);
  // @ts-ignore: brentvatne: I'm not sure how else to read the props off of a
  // component that renders null in testing-library, so I'm using this fairly
  // brittle internal API.
  return result.UNSAFE_root._fiber.return.child.child.pendingProps[prop];
}
