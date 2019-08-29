/* eslint-env jasmine, jest */
import { mount } from 'enzyme';
import React from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from '..';

const getStyleProp = (component, prop) => StyleSheet.flatten(component.prop('style'))[prop];

it(`a basic gradient`, () => {
    const component = mount(<LinearGradient colors={['white', 'rgba(0,0,0,0)']} />);
    expect(getStyleProp(component.find('View'), 'backgroundImage')).toMatchSnapshot();
});
  
it(`a complex gradient`, () => {
    const component = mount(
        <LinearGradient
        colors={['red', 'blue']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0.5, 1]}
        />
    );
    expect(getStyleProp(component.find('View'), 'backgroundImage')).toMatchSnapshot();
});

