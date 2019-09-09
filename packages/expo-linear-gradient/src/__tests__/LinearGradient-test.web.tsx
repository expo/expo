import { mount } from 'enzyme';
import React from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from '..';

const getStyleProp = (component, prop) => StyleSheet.flatten(component.prop('style'))[prop];

it(`renders a multi-color gradient background with alpha`, () => {
  const component = mount(<LinearGradient colors={['cyan', '#ff00ff', 'rgba(0,0,0,0)']} />);
  expect(getStyleProp(component.find('View'), 'backgroundImage')).toMatchSnapshot();
});

it(`renders a complex gradient with angles and locations`, () => {
  const component = mount(
    <LinearGradient
      colors={['red', 'rgba(0,255,255,0)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0.5, 1]}
    />
  );
  expect(getStyleProp(component.find('View'), 'backgroundImage')).toMatchSnapshot();
});
