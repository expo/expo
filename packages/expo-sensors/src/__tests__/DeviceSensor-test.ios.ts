import DeviceSensor from '../DeviceSensor';
import MockNativeSensorModule from './mocks/MockNativeSensorModule';

it(`tracks the listener count on iOS`, () => {
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

it(`doesn't manually start and stop observing on iOS`, () => {
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

function _countRemovedListeners(nativeModule) {
  let sum = 0;
  for (let call of nativeModule.removeListeners.mock.calls) {
    expect(typeof call[0] === 'number').toBe(true);
    sum += call[0];
  }
  return sum;
}
