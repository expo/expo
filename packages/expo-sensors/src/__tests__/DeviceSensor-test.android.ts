import DeviceSensor from '../DeviceSensor';
import MockNativeSensorModule from './mocks/MockNativeSensorModule';

it(`starts and stops observing on Android`, () => {
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
