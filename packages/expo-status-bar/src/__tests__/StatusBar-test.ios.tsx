import { mount } from 'enzyme';
import React from 'react';
import { Appearance } from 'react-native';

import ExpoStatusBar from '../StatusBar';

function mockAppearance(colorScheme, fn) {
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
