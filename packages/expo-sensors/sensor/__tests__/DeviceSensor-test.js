import { mockPlatformAndroid, mockPlatformIOS } from '../../../test/mocking';
import DeviceSensor from '../DeviceSensor';

it(`counts the number of listeners`, () => {
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  // Add listeners
  const subscription1 = sensor.addListener(() => {});
  expect(sensor.hasListeners()).toBe(true);
  expect(sensor.getListenerCount()).toBe(1);

  const subscription2 = sensor.addListener(() => {});
  sensor.addListener(() => {});
  expect(sensor.getListenerCount()).toBe(3);

  // Remove listeners
  subscription2.remove();
  expect(sensor.getListenerCount()).toBe(2);

  sensor.removeSubscription(subscription1);
  expect(sensor.getListenerCount()).toBe(1);

  sensor.removeAllListeners();
  expect(sensor.getListenerCount()).toBe(0);
});

it(`tracks the listener count on iOS`, () => {
  mockPlatformIOS();
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  // Add listeners
  const subscription1 = sensor.addListener(() => {});
  expect(nativeModule.addListener).toHaveBeenCalledTimes(1);

  sensor.addListener(() => {});
  sensor.addListener(() => {});
  expect(nativeModule.addListener).toHaveBeenCalledTimes(3);

  // Remove listeners
  subscription1.remove();
  expect(nativeModule.removeListeners).toHaveBeenCalledTimes(1);
  expect(nativeModule.removeListeners).toHaveBeenLastCalledWith(1);

  sensor.removeAllListeners();
  expect(_countRemovedListeners(nativeModule)).toBe(3);
});

it(`starts and stops observing on Android`, () => {
  mockPlatformAndroid();
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  expect(nativeModule.startObserving).not.toHaveBeenCalled();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();

  // Add listeners
  let subscription1 = sensor.addListener(() => {});
  expect(nativeModule.startObserving).toHaveBeenCalledTimes(1);
  let subscription2 = sensor.addListener(() => {});
  expect(nativeModule.startObserving).toHaveBeenCalledTimes(1);

  // Remove listeners
  subscription1.remove();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();
  subscription2.remove();
  expect(nativeModule.stopObserving).toHaveBeenCalledTimes(1);
});

it(`starts and stops observing after removing all listeners at once on Android`, () => {
  mockPlatformAndroid();
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  expect(nativeModule.startObserving).not.toHaveBeenCalled();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();

  // Add listeners
  sensor.addListener(() => {});
  expect(nativeModule.startObserving).toHaveBeenCalledTimes(1);
  sensor.addListener(() => {});
  expect(nativeModule.startObserving).toHaveBeenCalledTimes(1);

  // Remove listeners
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();
  sensor.removeAllListeners();
  expect(nativeModule.stopObserving).toHaveBeenCalledTimes(1);
  expect(sensor.hasListeners()).toBe(false);
});

it(`doesn't manually start and stop observing on iOS`, () => {
  mockPlatformIOS();
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  expect(nativeModule.startObserving).not.toHaveBeenCalled();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();

  // Add listeners
  let subscription1 = sensor.addListener(() => {});
  expect(nativeModule.startObserving).not.toHaveBeenCalled();
  let subscription2 = sensor.addListener(() => {});
  expect(nativeModule.startObserving).not.toHaveBeenCalled();

  // Remove listeners
  subscription1.remove();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();
  subscription2.remove();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();
});

it(`doesn't fail when a subscription is removed twice`, () => {
  mockPlatformIOS();
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  // Add listeners
  let subscription = sensor.addListener(() => {});
  expect(sensor.hasListeners()).toBe(true);

  // Remove listeners
  subscription.remove();
  expect(sensor.hasListeners()).toBe(false);
  expect(() => subscription.remove()).not.toThrow();
  expect(() => sensor.removeSubscription(subscription)).not.toThrow();
});

class MockNativeSensorModule {
  addListener = jest.fn(async () => {});
  removeListeners = jest.fn(async () => {});
  startObserving = jest.fn(async () => {});
  stopObserving = jest.fn(async () => {});
  setUpdateInterval = jest.fn(async () => {});
}

function _countRemovedListeners(nativeModule) {
  let sum = 0;
  for (let call of nativeModule.removeListeners.mock.calls) {
    expect(typeof call[0] === 'number').toBe(true);
    sum += call[0];
  }
  return sum;
}
