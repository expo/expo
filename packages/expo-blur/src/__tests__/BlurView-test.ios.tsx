/* eslint-env jasmine, jest */
import { mount } from 'enzyme';
import React from 'react';
import { BlurView } from '..';

it(`renders a native blur view`, () => {
  const component = mount(<BlurView tint={'light'} intensity={0.65} />);
  // console.log('component:', component.debug({ verbose: true }));
  expect(
    component.find('ViewManagerAdapter_ExpoBlurView').prop('proxiedProperties')
  ).toMatchSnapshot();
});
