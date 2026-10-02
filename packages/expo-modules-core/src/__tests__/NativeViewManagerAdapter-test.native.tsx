import { render } from '@testing-library/react-native';
import { Children } from 'react';

import { requireNativeViewManager } from '../NativeViewManagerAdapter';

jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  // Mock a natively defined test view that the adapter will reference
  ReactNative.NativeModules.NativeUnimoduleProxy.viewManagersMetadata.ExpoTestView = {
    propsNames: ['custom'],
  };
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
    const TestView = requireNativeViewManager('ExpoTestView');
    expect(TestView.displayName).toBe('ExpoTestView');
  });

  it(`partitions props into React Native and custom props`, async () => {
    const TestView = requireNativeViewManager('ExpoTestView');
    const { container } = await render(
      <TestView testID="test" custom="hello">
        <TestView />
      </TestView>
    );

    // NOTE: update this test if the naming scheme of the native adapter components changes
    const testNativeComponent = container.queryAll(
      (node) => node.type === 'ViewManagerAdapter_ExpoTestView'
    )[0]!;
    expect(testNativeComponent).toBeDefined();

    // React Native props
    expect(testNativeComponent.props.testID).toBe('test');
    expect(Children.toArray(testNativeComponent.props.children)).toHaveLength(1);

    // Custom props
    expect(testNativeComponent.props.custom).toEqual('hello');
  });

  it(`maps aria props to their native accessibility props`, async () => {
    const TestView = requireNativeViewManager('ExpoTestView');
    const { container } = await render(
      <TestView
        aria-hidden
        aria-label="Next"
        aria-disabled
        aria-valuenow={5}
        aria-live="off"
        id="symbol"
        accessibilityState={{ selected: true }}
      />
    );

    const testNativeComponent = container.queryAll(
      (node) => node.type === 'ViewManagerAdapter_ExpoTestView'
    )[0]!;

    expect(testNativeComponent.props).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
      accessibilityLabel: 'Next',
      accessibilityLiveRegion: 'none',
      accessibilityState: { disabled: true, selected: true },
      accessibilityValue: { now: 5 },
      nativeID: 'symbol',
    });
    expect(testNativeComponent.props).not.toHaveProperty('aria-hidden');
    expect(testNativeComponent.props).not.toHaveProperty('id');
  });

  it(`gives aria props precedence over accessibility props`, async () => {
    const TestView = requireNativeViewManager('ExpoTestView');
    const { container } = await render(
      <TestView aria-label="Next" accessibilityLabel="Forward" aria-hidden={false} />
    );

    const testNativeComponent = container.queryAll(
      (node) => node.type === 'ViewManagerAdapter_ExpoTestView'
    )[0]!;

    expect(testNativeComponent.props.accessibilityLabel).toBe('Next');
    expect(testNativeComponent.props.accessibilityElementsHidden).toBe(false);
    expect(testNativeComponent.props.importantForAccessibility).toBeUndefined();
  });
});
