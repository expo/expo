/* eslint-env jasmine, jest */
import React from 'react';
import { mount } from 'enzyme';
import { StyleSheet } from 'react-native';

import { BlurView } from '..';

const getStyleProp = (component, prop) => StyleSheet.flatten(component.prop('style'))[prop];

it(`uses a transparent background color when filters aren't supported`, () => {
  // @ts-ignore
  let originalCSS = global.CSS;
  // @ts-ignore
  global.CSS = {
    supports() {
      return true;
    },
  };

  const withNativeBlur = mount(<BlurView tint={'light'} />);
  expect(getStyleProp(withNativeBlur.find('div'), 'WebkitBackdropFilter')).toBeDefined();
  expect(getStyleProp(withNativeBlur.find('div'), 'backdropFilter')).toBeDefined();

  // @ts-ignore
  global.CSS = undefined;

  const withoutNativeBlur = mount(<BlurView tint={'light'} />);
  expect(getStyleProp(withoutNativeBlur.find('div'), 'WebkitBackdropFilter')).not.toBeDefined();
  expect(getStyleProp(withoutNativeBlur.find('div'), 'backdropFilter')).not.toBeDefined();
  expect(getStyleProp(withoutNativeBlur.find('div'), 'backgroundColor')).toBeDefined();

  // @ts-ignore
  global.CSS = originalCSS;
});
