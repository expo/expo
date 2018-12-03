import { Platform } from 'react-native';

import EventEmitter from '../EventEmitter';

it(`emits events to subscribers`, () => {
  let mockNativeModule = _createMockNativeModule();
  let emitter = new EventEmitter(mockNativeModule);

  let mockListener = jest.fn();
  emitter.addListener('test', mockListener);

  emitter.emit('test');
  expect(mockListener).toHaveBeenCalledTimes(1);
  expect(mockListener).toHaveBeenLastCalledWith();

  emitter.emit('test', 'hello', 'world');
  expect(mockListener).toHaveBeenCalledTimes(2);
  expect(mockListener).toHaveBeenLastCalledWith('hello', 'world');
});

it(`removes all listeners of an event`, () => {
  let mockNativeModule = _createMockNativeModule();
  let emitter = new EventEmitter(mockNativeModule);

  let mockListener = jest.fn();
  emitter.addListener('test', mockListener);
  emitter.removeAllListeners('test');

  emitter.emit('test');
  expect(mockListener).not.toHaveBeenCalled();
});

it(`removes a single event subscription`, () => {
  let mockNativeModule = _createMockNativeModule();
  let emitter = new EventEmitter(mockNativeModule);

  let mockListener = jest.fn();
  let subscription = emitter.addListener('test', mockListener);
  emitter.removeSubscription(subscription);

  emitter.emit('test');
  expect(mockListener).not.toHaveBeenCalled();
});

describe('subscriptions', () => {
  it(`removes itself`, () => {
    let mockNativeModule = _createMockNativeModule();
    let emitter = new EventEmitter(mockNativeModule);

    let mockListener = jest.fn();
    let subscription = emitter.addListener('test', mockListener);
    subscription.remove();

    emitter.emit('test');
    expect(mockListener).not.toHaveBeenCalled();
  });
});

describe('Android', () => {
  let originalOS;

  beforeAll(() => {
    originalOS = Platform.OS;
    Platform.OS = 'android';
  });

  afterAll(() => {
    Platform.OS = originalOS;
  });

  it(`notifies the native module to start and stop observing events`, () => {
    let mockNativeModule = _createMockNativeModule();
    let emitter = new EventEmitter(mockNativeModule);

    // Start observing only when we add the first listener
    let subscription1 = emitter.addListener('test', () => {});
    expect(mockNativeModule.startObserving).toHaveBeenCalledTimes(1);
    let subscription2 = emitter.addListener('test', () => {});
    expect(mockNativeModule.startObserving).toHaveBeenCalledTimes(1);
    let subscription3 = emitter.addListener('other', () => {});
    expect(mockNativeModule.startObserving).toHaveBeenCalledTimes(1);

    // Stop observing only when we remove the last listener
    emitter.removeSubscription(subscription1);
    expect(mockNativeModule.stopObserving).not.toHaveBeenCalled();
    emitter.removeSubscription(subscription3);
    expect(mockNativeModule.stopObserving).not.toHaveBeenCalled();
    emitter.removeSubscription(subscription2);
    expect(mockNativeModule.stopObserving).toHaveBeenCalledTimes(1);
  });

  it(`notifies the native module to stop observing when removing all listeners`, () => {
    let mockNativeModule = _createMockNativeModule();
    let emitter = new EventEmitter(mockNativeModule);

    emitter.addListener('test', () => {});
    emitter.addListener('test', () => {});
    emitter.removeAllListeners('test');
    expect(mockNativeModule.stopObserving).toHaveBeenCalledTimes(1);
  });

  // NOTE: This test is currently broken and reveals a bug. Un-skip this test when the bug is fixed.
  it.skip(`notifies the native module to stop observing when a subscription removes itself`, () => {
    let mockNativeModule = _createMockNativeModule();
    let emitter = new EventEmitter(mockNativeModule);

    let mockListener = jest.fn();
    let subscription = emitter.addListener('test', mockListener);
    expect(mockNativeModule.startObserving).toHaveBeenCalledTimes(1);

    subscription.remove();
    expect(mockNativeModule.stopObserving).toHaveBeenCalledTimes(1);
  });
});

function _createMockNativeModule() {
  return {
    startObserving: jest.fn(),
    stopObserving: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };
}
