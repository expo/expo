/* eslint-env jasmine, jest */
import { mount } from 'enzyme';
import React from 'react';
import { LinearGradient } from '..';

it(`renders a complex gradient`, () => {
  const component = mount(
    <LinearGradient
      colors={['red', 'blue']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0.5, 1]}
    />
  );
  // console.log('component:', component.debug({ verbose: true }));
  expect(component.find('ViewManagerAdapter_ExpoLinearGradient').prop('proxiedProperties')).toMatchSnapshot();
});

