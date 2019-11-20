import DeviceSensor from '../DeviceSensor';
import MockNativeSensorModule from './mocks/MockNativeSensorModule';

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
