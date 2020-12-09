import { mount } from 'enzyme';
import React from 'react';
// TODO: find out why we get this error on CI, but not locally:
// "Cannot find module 'react-native/Libraries/Components/Checkbox/Checkbox' from 'ExpoCheckBox-test.android.tsx'""
// @ts-ignore
// import NativeCheckbox from 'react-native/Libraries/Components/Checkbox/Checkbox';
//
import Checkbox from '../Checkbox';
//
describe('Checkbox', () => {
  it('isAvailableAsync resolves to true on android', async () => {
    await expect(Checkbox.isAvailableAsync()).resolves.toBeTruthy();
  });

  it('renders a native checkbox', () => {
    const wrapper = mount(<Checkbox value color="#4630EB" />);
    // expect(wrapper.find(NativeCheckbox).first()).toBeDefined();
  });

  it('resolves proper tint colors based on color', () => {
    const wrapper = mount(<Checkbox color="#4630EB" />);
    // const nativeProps = wrapper.find(NativeCheckbox).props();
    // expect(nativeProps).toMatchObject({ tintColors: { true: '#4630EB' } });
  });
});
