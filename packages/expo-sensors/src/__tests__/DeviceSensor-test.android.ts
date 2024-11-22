import DeviceSensor from '../DeviceSensor';
import MockNativeSensorModule from './mocks/MockNativeSensorModule';

it(`starts and stops observing after removing all listeners at once on Android`, () => {
  const nativeModule = new MockNativeSensorModule();
  const sensor = new DeviceSensor(nativeModule, 'mockDidUpdate');

  // Add listeners
  sensor.addListener(() => {});
  sensor.addListener(() => {});

  // Remove listeners
  sensor.removeAllListeners();
  expect(sensor.hasListeners()).toBe(false);
});
