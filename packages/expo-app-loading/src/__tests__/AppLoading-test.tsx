import { mount } from 'enzyme';
import { mockProperty, unmockProperty } from 'jest-expo';
import React from 'react';

import AppLoading, { getAppLoadingLifecycleEmitter } from '../AppLoading';
import * as SplashScreen from '../SplashScreen';

it(`emits lifecycle events`, () => {
  const onMount = jest.fn();
  const onUnmount = jest.fn();

  getAppLoadingLifecycleEmitter().once('componentDidMount', onMount);
  getAppLoadingLifecycleEmitter().once('componentWillUnmount', onUnmount);

  const wrapper = mount(<AppLoading />);
  expect(onMount).toBeCalled();
  expect(onUnmount).not.toBeCalled();
  wrapper.unmount();
  expect(onUnmount).toBeCalled();
});

describe('splash screen side effects', () => {
  // @ts-ignore
  const originalE2e = global.__E2E__;

  beforeAll(() => {
    // @ts-ignore
    global.__E2E__ = true;
  });

  afterAll(() => {
    // @ts-ignore
    global.__E2E__ = originalE2e;
  });

  it(`prevents and auto-hides splash screen`, () => {
    const preventHideSpy = jest.fn();
    const hideSpy = jest.fn();

    mockProperty(SplashScreen, 'preventAutoHideAsync', preventHideSpy);
    mockProperty(SplashScreen, 'hideAsync', hideSpy);

    const wrapper = mount(<AppLoading />);
    expect(preventHideSpy).toBeCalled();
    wrapper.unmount();
    expect(hideSpy).toBeCalled();

    unmockProperty(SplashScreen, 'preventAutoHideAsync');
    unmockProperty(SplashScreen, 'hideAsync');
  });

  it('does not auto-hide when disabled', () => {
    const hideSpy = jest.fn();
    mockProperty(SplashScreen, 'hideAsync', hideSpy);

    const wrapper = mount(<AppLoading autoHideSplash={false} />);
    wrapper.unmount();
    expect(hideSpy).not.toBeCalled();

    unmockProperty(SplashScreen, 'hideAsync');
  });
});

describe('component behavior', () => {
  it(`doesn't render anything`, () => {
    const wrapper = mount(<AppLoading />);
    expect(wrapper.instance()).toBeNull();
  });

  // todo: test if this error is thrown
  // it(`requires onFinish with startAsync`, () => {
  //   expect(() => mount(<AppLoading startAsync={Promise.resolve} />)).toThrowError(
  //     'AppLoading onFinish prop is required if startAsync is provided'
  //   );
  // });

  it(`calls onFinish when startAsync resolves`, async () => {
    const promise = Promise.resolve();
    const onFinish = jest.fn();
    const onError = jest.fn();

    mount(<AppLoading startAsync={() => promise} onFinish={onFinish} onError={onError} />);

    await promise;
    expect(onError).not.toBeCalled();
    expect(onFinish).toBeCalled();
  });

  it(`calls onError and onFinish when startAsync rejects`, async () => {
    const error = new Error('Something failed during loading');
    const promise = Promise.reject(error);
    const onFinish = jest.fn();
    const onError = jest.fn();

    mount(<AppLoading startAsync={() => promise} onFinish={onFinish} onError={onError} />);

    try {
      await promise;
    } catch {
      // ignore the error, its expected
    }

    expect(onError).toBeCalledWith(error);
    expect(onFinish).toBeCalled();
  });
});
