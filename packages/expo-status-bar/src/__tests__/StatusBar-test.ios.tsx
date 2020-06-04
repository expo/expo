import { mount } from 'enzyme';
import * as React from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

import { StatusBar as ExpoStatusBar } from '../StatusBar';

function mockAppearance(colorScheme: ColorSchemeName, fn: any) {
  const originalGetColorScheme = Appearance.getColorScheme;
  Appearance.getColorScheme = () => colorScheme;
  try {
    fn();
  } finally {
    Appearance.getColorScheme = originalGetColorScheme;
  }
}

describe('StatusBar', () => {
  it('uses light-content instead of default when dark mode', () => {
    mockAppearance('dark', () => {
      const result = mount(<ExpoStatusBar barStyle="default" />);
      expect(
        result
          .children()
          .first()
          .props().barStyle
      ).toEqual('light-content');
    });
  });

  it('uses dark-content instead of default when light mode', () => {
    mockAppearance('light', () => {
      const result = mount(<ExpoStatusBar barStyle="default" />);
      expect(
        result
          .children()
          .first()
          .props().barStyle
      ).toEqual('dark-content');
    });
  });
});
