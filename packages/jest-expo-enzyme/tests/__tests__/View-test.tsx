import { shallow } from 'enzyme';
import * as React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

it(`renders a view with a custom background`, () => {
  const component = shallow(<View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />);
  // To debug your component use this:
  console.log('Component:', component.debug({ verbose: true }));

  // When snapshot testing, you should try to include just the output you want to test in your snapshot
  // here we are extracting the style prop from `View` on native and `div` on web
  const prop = component.find(Platform.select({ default: 'View', web: 'div' })).prop('style');

  // Flatten the style so we can read it as an object
  const style = StyleSheet.flatten(prop);

  /**
   * Android: exports[`renders a view with a custom background 1`] = `"rgba(0,0,0,0.5)"`;
   * iOS: exports[`renders a view with a custom background 1`] = `"rgba(0,0,0,0.5)"`;
   * web: exports[`renders a view with a custom background 1`] = `"rgba(0,0,0,0.50)"`;
   */
  expect(style.backgroundColor).toMatchSnapshot();
});
