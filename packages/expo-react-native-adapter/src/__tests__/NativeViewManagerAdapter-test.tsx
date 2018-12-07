import React from 'react';
import TestRenderer from 'react-test-renderer';

import { requireNativeViewManager } from '../NativeViewManagerAdapter';

jest.mock('react-native', () => {
  const ReactNative = require.requireActual('react-native');
  // Mock a natively defined test view that the adapter will reference
  ReactNative.NativeModules.ExpoNativeModuleProxy.viewManagersNames = [
    ...ReactNative.NativeModules.ExpoNativeModuleProxy.viewManagersNames,
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
    const TestView = requireNativeViewManager('ExpoTestView');
    expect(TestView.displayName).toBe('Adapter<ExpoTestView>');
  });

  it(`partitions props into React Native and custom props`, () => {
    const TestView = requireNativeViewManager('ExpoTestView');
    let testRenderer = TestRenderer.create(
      <TestView testID="test" custom="hello">
        <TestView />
      </TestView>
    );
    let testInstance = testRenderer.root;
    // NOTE: update this test if the naming scheme of the native adapter components changes
    let testNativeComponent = testInstance.findByType('ViewManagerAdapter_ExpoTestView' as any);
    expect(testNativeComponent).toBeDefined();

    // React Native props
    expect(testNativeComponent.props.testID).toBe('test');
    expect(React.Children.toArray(testNativeComponent.props.children)).toHaveLength(1);
  
    // Custom props
    expect(testNativeComponent.props.proxiedProperties).toEqual({ custom: 'hello' });
    expect(testNativeComponent.props).not.toHaveProperty('custom');
  });
});
