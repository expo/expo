import type { ExpoGlobal } from '../../ts-declarations/global';
import '../../web/CoreModule';

function getSampleEmitter() {
  return new (globalThis.expo as ExpoGlobal).EventEmitter<Record<string, () => void>>();
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
    (emitter1 as any).startObserving = jest.fn();
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
});
