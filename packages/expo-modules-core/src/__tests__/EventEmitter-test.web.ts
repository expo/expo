import EventEmitter from '../EventEmitter';

type TestEventsMap = {
  test(...args: any): void;
  other(): void;
};

afterEach(() => {
  jest.resetModules();
});

it(`emits events to listeners`, () => {
  const emitter = new EventEmitter<TestEventsMap>();

  const mockListener = jest.fn();
  emitter.addListener('test', mockListener);

  emitter.emit('test');
  expect(mockListener).toHaveBeenCalledTimes(1);
  expect(mockListener).toHaveBeenLastCalledWith();

  emitter.emit('test', 'hello', 'world');
  expect(mockListener).toHaveBeenCalledTimes(2);
  expect(mockListener).toHaveBeenLastCalledWith('hello', 'world');
});

it(`removes all listeners of an event`, () => {
  const emitter = new EventEmitter<TestEventsMap>();

  const mockListener = jest.fn();
  emitter.addListener('test', mockListener);
  emitter.removeAllListeners('test');

  emitter.emit('test');
  expect(mockListener).not.toHaveBeenCalled();
});

it(`removes a single event subscription`, () => {
  const emitter = new EventEmitter<TestEventsMap>();

  const mockListener = jest.fn();
  const subscription = emitter.addListener('test', mockListener);
  subscription.remove();

  emitter.emit('test');
  expect(mockListener).not.toHaveBeenCalled();
});

// NOTE: this test currently fails because of NativeEventEmitter's design
it.skip(`doesn't emit events to other emitters' listeners`, () => {
  const emitter1 = new EventEmitter<TestEventsMap>();
  const emitter2 = new EventEmitter<TestEventsMap>();

  const mockListener1 = jest.fn();
  emitter1.addListener('test', mockListener1);
  emitter2.emit('test');

  expect(mockListener1).not.toHaveBeenCalled();
});

// NOTE: this test currently fails because of NativeEventEmitter's design
it.skip(`doesn't remove other emitters' listeners`, () => {
  const emitter1 = new EventEmitter<TestEventsMap>();
  const emitter2 = new EventEmitter<TestEventsMap>();

  const mockListener1 = jest.fn();
  emitter1.addListener('test', mockListener1);
  emitter2.removeAllListeners('test');

  emitter1.emit('test');
  expect(mockListener1).toHaveBeenCalled();
});

describe('subscriptions', () => {
  it(`removes itself`, () => {
    const emitter = new EventEmitter<TestEventsMap>();

    const mockListener = jest.fn();
    const subscription = emitter.addListener('test', mockListener);
    subscription.remove();

    emitter.emit('test');
    expect(mockListener).not.toHaveBeenCalled();
  });
});

// TODO: Enable these tests once Web supports `startObserving` and `stopObserving`.
xdescribe('observing', () => {
  it(`notifies the native module to start and stop observing events`, () => {
    const emitter = new EventEmitter<TestEventsMap>();

    emitter.startObserving = jest.fn();
    emitter.stopObserving = jest.fn();

    // Start observing only when we add the first listener
    const subscription1 = emitter.addListener('test', () => {});
    expect(emitter.startObserving).toHaveBeenCalledTimes(1);
    const subscription2 = emitter.addListener('test', () => {});
    expect(emitter.startObserving).toHaveBeenCalledTimes(1);
    const subscription3 = emitter.addListener('other', () => {});
    expect(emitter.startObserving).toHaveBeenCalledTimes(1);

    // Stop observing only when we remove the last listener
    subscription1.remove();
    expect(emitter.stopObserving).not.toHaveBeenCalled();
    subscription3.remove();
    expect(emitter.stopObserving).not.toHaveBeenCalled();
    subscription2.remove();
    expect(emitter.stopObserving).toHaveBeenCalledTimes(1);
  });

  it(`notifies the native module to stop observing when removing all listeners`, () => {
    const emitter = new EventEmitter<TestEventsMap>();

    emitter.stopObserving = jest.fn();

    emitter.addListener('test', () => {});
    emitter.addListener('test', () => {});
    emitter.removeAllListeners('test');
    expect(emitter.stopObserving).toHaveBeenCalledTimes(1);
  });

  it(`notifies the native module to stop observing when a subscription removes itself`, () => {
    const emitter = new EventEmitter<TestEventsMap>();

    emitter.startObserving = jest.fn();
    emitter.stopObserving = jest.fn();

    const mockListener = jest.fn();
    const subscription = emitter.addListener('test', mockListener);
    expect(emitter.startObserving).toHaveBeenCalledTimes(1);

    subscription.remove();
    expect(emitter.stopObserving).toHaveBeenCalledTimes(1);
  });

  it(`removes subscriptions idempotently`, () => {
    const emitter = new EventEmitter<TestEventsMap>();

    emitter.startObserving = jest.fn();
    emitter.stopObserving = jest.fn();

    const mockListener = jest.fn();
    const subscription1 = emitter.addListener('test', mockListener);
    const subscription2 = emitter.addListener('test', mockListener);
    expect(emitter.startObserving).toHaveBeenCalledTimes(1);

    subscription1.remove();
    subscription1.remove();
    expect(emitter.stopObserving).not.toHaveBeenCalled();

    subscription2.remove();
    expect(emitter.stopObserving).toHaveBeenCalledTimes(1);
  });
});
