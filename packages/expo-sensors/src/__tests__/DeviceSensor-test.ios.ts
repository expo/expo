import DeviceSensor from '../DeviceSensor';
import MockNativeSensorModule from './mocks/MockNativeSensorModule';

it(`starts and stops observing on iOS`, () => {
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');
  expect(nativeModule.startObserving).not.toHaveBeenCalled();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();

  // Add listeners
  const subscription1 = sensor.addListener(() => {});
  expect(nativeModule.startObserving).toHaveBeenCalledWith('mockDidUpdate');
  const subscription2 = sensor.addListener(() => {});
  expect(nativeModule.startObserving).toHaveBeenCalledTimes(1);

  // Remove listeners
  subscription1.remove();
  expect(nativeModule.stopObserving).not.toHaveBeenCalled();
  subscription2.remove();
  expect(nativeModule.stopObserving).toHaveBeenCalledWith('mockDidUpdate');
});

it(`doesn't fail when a subscription is removed twice`, () => {
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  // Add listeners
  const subscription = sensor.addListener(() => {});
  expect(sensor.hasListeners()).toBe(true);

  // Remove listeners
  subscription.remove();
  expect(sensor.hasListeners()).toBe(false);
  expect(() => subscription.remove()).not.toThrow();
  expect(() => sensor.removeSubscription(subscription)).not.toThrow();
});
