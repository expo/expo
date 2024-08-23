import type { ExpoGlobal } from '../../ts-declarations/global';
import '../../';

function getSampleEmitter() {
  return new (globalThis.expo as ExpoGlobal).EventEmitter<any>();
}

describe(`EventEmitter`, () => {
  it(`emits events to listeners`, () => {
    const emitter = getSampleEmitter();
    const listener = jest.fn();
    emitter.addListener('testEventName', listener);
    emitter.emit('testEventName');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it(`removes all listeners of an event`, () => {
    const emitter = getSampleEmitter();
    const listener = jest.fn();
    emitter.addListener('testEventName', listener);
    emitter.removeAllListeners('testEventName');
    emitter.emit('testEventName');
    expect(listener).not.toHaveBeenCalled();
  });

  it(`removes a single event listener`, () => {
    const emitter = getSampleEmitter();
    const listener = jest.fn();
    emitter.addListener('testEventName', listener);
    emitter.removeListener('testEventName', listener);
    emitter.emit('testEventName');
    expect(listener).not.toHaveBeenCalled();
  });

  it(`doesn't emit events to other emitters' listeners`, () => {
    const emitter1 = getSampleEmitter();
    const emitter2 = getSampleEmitter();
    const listener = jest.fn();
    emitter1.addListener('testEventName', listener);
    emitter2.emit('testEventName');
    expect(listener).not.toHaveBeenCalled();
  });

  it(`calls startObserving when connecting first listener`, () => {
    const emitter1 = getSampleEmitter();
    const listener = jest.fn();
    emitter1.startObserving = jest.fn();
    emitter1.addListener('testEventName', listener);
    expect((emitter1 as any).startObserving).toHaveBeenCalledTimes(1);
    expect((emitter1 as any).startObserving).toHaveBeenCalledWith('testEventName');
  });

  it(`does not call callsStartObserving when connecting second listener`, () => {
    const emitter1 = getSampleEmitter();
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    (emitter1 as any).startObserving = jest.fn();
    emitter1.addListener('testEventName', listener1);
    emitter1.addListener('testEventName', listener2);

    expect((emitter1 as any).startObserving).toHaveBeenCalledTimes(1);
    expect((emitter1 as any).startObserving).toHaveBeenCalledWith('testEventName');
  });

  it(`calls callsStartObserving for each new event name`, () => {
    const emitter1 = getSampleEmitter();
    const listener1 = jest.fn();
    (emitter1 as any).startObserving = jest.fn();
    emitter1.addListener('testEventName', listener1);
    emitter1.addListener('testEventName2', listener1);
    expect((emitter1 as any).startObserving).toHaveBeenCalledTimes(2);
  });

  it(`calls stopObserving when removing last listener`, () => {
    const emitter1 = getSampleEmitter();
    const listener1 = jest.fn();
    (emitter1 as any).stopObserving = jest.fn();
    emitter1.addListener('testEventName', listener1);
    emitter1.removeListener('testEventName', listener1);
    expect((emitter1 as any).stopObserving).toHaveBeenCalledTimes(1);
    expect((emitter1 as any).stopObserving).toHaveBeenCalledWith('testEventName');
  });

  it(`does not call stopObserving when removing second last listener`, () => {
    const emitter1 = getSampleEmitter();
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    (emitter1 as any).stopObserving = jest.fn();
    emitter1.addListener('testEventName', listener1);
    emitter1.addListener('testEventName', listener2);
    emitter1.removeListener('testEventName', listener1);
    expect((emitter1 as any).stopObserving).not.toHaveBeenCalled();
  });

  it(`does not call stopObserving when trying to remove non-existing listeners`, () => {
    const emitter1 = getSampleEmitter();
    const listener1 = jest.fn();
    (emitter1 as any).stopObserving = jest.fn();
    emitter1.addListener('testEventName', listener1);
    emitter1.removeListener('testEventName', () => {});
    expect((emitter1 as any).stopObserving).not.toHaveBeenCalled();
  });

  it(`calls stopObserving when calling removeAllListeners for an event`, () => {
    const emitter1 = getSampleEmitter();
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    (emitter1 as any).stopObserving = jest.fn();
    emitter1.addListener('testEventName', listener1);
    emitter1.addListener('testEventName', listener2);
    emitter1.removeAllListeners('testEventName');
    expect((emitter1 as any).stopObserving).toHaveBeenCalledTimes(1);
    expect((emitter1 as any).stopObserving).toHaveBeenCalledWith('testEventName');
  });

  it(`does not call startObserving when adding the same listener multiple times`, () => {
    const emitter1 = getSampleEmitter();
    const listener1 = jest.fn();
    (emitter1 as any).startObserving = jest.fn();
    emitter1.addListener('testEventName', listener1);
    emitter1.addListener('testEventName', listener1);
    expect((emitter1 as any).startObserving).toHaveBeenCalledTimes(1);
  });

  it(`emits events to listeners`, () => {
    const emitter = getSampleEmitter();
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
    const emitter = getSampleEmitter();
    const mockListener = jest.fn();
    emitter.addListener('test', mockListener);
    emitter.removeAllListeners('test');

    emitter.emit('test');
    expect(mockListener).not.toHaveBeenCalled();
  });

  it(`removes a single event subscription`, () => {
    const emitter = getSampleEmitter();
    const mockListener = jest.fn();
    const subscription = emitter.addListener('test', mockListener);
    subscription.remove();

    emitter.emit('test');
    expect(mockListener).not.toHaveBeenCalled();
  });

  // NOTE: this test currently fails because of NativeEventEmitter's design
  it(`doesn't emit events to other emitters' listeners`, () => {
    const emitter1 = getSampleEmitter();
    const emitter2 = getSampleEmitter();

    const mockListener1 = jest.fn();
    emitter1.addListener('test', mockListener1);
    emitter2.emit('test');

    expect(mockListener1).not.toHaveBeenCalled();
  });

  // NOTE: this test currently fails because of NativeEventEmitter's design
  it(`doesn't remove other emitters' listeners`, () => {
    const emitter1 = getSampleEmitter();
    const emitter2 = getSampleEmitter();

    const mockListener1 = jest.fn();
    emitter1.addListener('test', mockListener1);
    emitter2.removeAllListeners('test');

    emitter1.emit('test');
    expect(mockListener1).toHaveBeenCalled();
  });

  describe('subscriptions', () => {
    it(`removes itself`, () => {
      const emitter = getSampleEmitter();

      const mockListener = jest.fn();
      const subscription = emitter.addListener('test', mockListener);
      subscription.remove();

      emitter.emit('test');
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  // TODO: Enable these tests once Web supports `startObserving` and `stopObserving`.
  describe('observing', () => {
    it(`notifies the native module to start and stop observing events`, () => {
      const emitter = getSampleEmitter();

      emitter.startObserving = jest.fn();
      emitter.stopObserving = jest.fn();

      // Start observing only when we add the first listener
      const subscription1 = emitter.addListener('test', () => {});
      expect(emitter.startObserving).toHaveBeenCalledTimes(1);
      const subscription2 = emitter.addListener('test', () => {});
      expect(emitter.startObserving).toHaveBeenCalledTimes(1);
      const subscription3 = emitter.addListener('other', () => {});
      expect(emitter.startObserving).toHaveBeenCalledTimes(2);
      expect(emitter.startObserving).toHaveBeenLastCalledWith('other');
      expect(emitter.startObserving).toHaveBeenNthCalledWith(1, 'test');
      // Stop observing only when we remove the last listener
      subscription1.remove();
      expect(emitter.stopObserving).not.toHaveBeenCalled();
      subscription3.remove();
      expect(emitter.stopObserving).toHaveBeenCalled();
      subscription2.remove();
      expect(emitter.stopObserving).toHaveBeenCalledTimes(2);
    });

    it(`notifies the native module to stop observing when removing all listeners`, () => {
      const emitter = getSampleEmitter();

      emitter.stopObserving = jest.fn();

      emitter.addListener('test', () => {});
      emitter.addListener('test', () => {});
      emitter.removeAllListeners('test');
      expect(emitter.stopObserving).toHaveBeenCalledTimes(1);
    });

    it(`notifies the native module to stop observing when a subscription removes itself`, () => {
      const emitter = getSampleEmitter();

      emitter.startObserving = jest.fn();
      emitter.stopObserving = jest.fn();

      const mockListener = jest.fn();
      const subscription = emitter.addListener('test', mockListener);
      expect(emitter.startObserving).toHaveBeenCalledTimes(1);

      subscription.remove();
      expect(emitter.stopObserving).toHaveBeenCalledTimes(1);
    });

    it(`treats adding the same listener twice as adding a single listener and fires stopObserving in the correct moment`, () => {
      const emitter = getSampleEmitter();

      emitter.startObserving = jest.fn();
      emitter.stopObserving = jest.fn();

      const mockListener = jest.fn();
      const subscription1 = emitter.addListener('test', mockListener);
      const subscription2 = emitter.addListener('test', mockListener);
      expect(emitter.startObserving).toHaveBeenCalledTimes(1);

      subscription1.remove();
      subscription1.remove();
      expect(emitter.stopObserving).toHaveBeenCalledTimes(1);

      subscription2.remove();
      expect(emitter.stopObserving).toHaveBeenCalledTimes(1);
    });
  });
});
