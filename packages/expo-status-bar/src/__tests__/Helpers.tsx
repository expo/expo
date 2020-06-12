import { mount } from 'enzyme';
import { Appearance, ColorSchemeName } from 'react-native';

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

  return result
    .children()
    .first()
    .props()[prop];
}
