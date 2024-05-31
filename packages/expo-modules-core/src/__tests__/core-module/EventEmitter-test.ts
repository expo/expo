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
});
