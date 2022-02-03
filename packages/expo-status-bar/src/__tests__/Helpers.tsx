import { mount } from 'enzyme';
import { Appearance, ColorSchemeName } from 'react-native';

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
  const originalGetColorScheme = Appearance.getColorScheme;
  Appearance.getColorScheme = () => colorScheme;
  try {
    fn();
  } finally {
    Appearance.getColorScheme = originalGetColorScheme;
  }
}

export function renderedPropValue(element: any, prop: string) {
  const result = mount(element);

  return result.children().first().props()[prop];
}
