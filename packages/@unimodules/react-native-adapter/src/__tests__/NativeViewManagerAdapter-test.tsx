import React from 'react';
import TestRenderer from 'react-test-renderer';

import { requireNativeViewManager } from '../NativeViewManagerAdapter';

jest.mock('react-native', () => {
  const ReactNative = require.requireActual('react-native');
  // Mock a natively defined test view that the adapter will reference
  ReactNative.NativeModules.NativeUnimoduleProxy.viewManagersNames = [
    ...ReactNative.NativeModules.NativeUnimoduleProxy.viewManagersNames,
    'ExpoTestView',
  ];
  ReactNative.UIManager.ExpoTestView = {
    NativeProps: {},
    directEventTypes: {},
  };
  return ReactNative;
});

describe('requireNativeViewManager', () => {
  it(`sets the "displayName" of the native component`, () => {
    // USING REACT INTERNALS HERE! `getComponentName()` isn't exported from
    // React, so we can't test the resulting component name the way React will
    // definitely calculate it. For now, let's use the fact that we know that
    // TestView will be a ForwardRef which stores the underlying render function
    // under the `render` property and that's how the component name is
    // calculated.
    // https://github.com/facebook/react/blob/769b1f270e1251d9dbdce0fcbd9e92e502d059b8/packages/shared/getComponentName.js#L81
    const TestView: any = requireNativeViewManager('ExpoTestView');
    expect(TestView.render.displayName).toBe('Adapter<ExpoTestView>');
  });

  it(`partitions props into React Native and custom props`, () => {
    const TestView = requireNativeViewManager('ExpoTestView');
    const testRenderer = TestRenderer.create(
      <TestView testID="test" custom="hello">
        <TestView />
      </TestView>
    );
    const testInstance = testRenderer.root;
    // NOTE: update this test if the naming scheme of the native adapter components changes
    const testNativeComponent = testInstance.findByType('ViewManagerAdapter_ExpoTestView' as any);
    expect(testNativeComponent).toBeDefined();

    // React Native props
    expect(testNativeComponent.props.testID).toBe('test');
    expect(React.Children.toArray(testNativeComponent.props.children)).toHaveLength(1);

    // Custom props
    expect(testNativeComponent.props.proxiedProperties).toEqual({ custom: 'hello' });
    expect(testNativeComponent.props).not.toHaveProperty('custom');
  });
});
