import { DevToolsPluginEventEmitter as EventEmitter } from '../DevToolsPluginEventEmitter';

describe(EventEmitter, () => {
  it('emits events to listeners with all arguments', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    const subscription = emitter.addListener('test', listener);
    emitter.emit('test', 1, 2, 3);
    expect(listener).toHaveBeenCalledWith(1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(1);

    subscription.remove();
    emitter.emit('test', 1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('emits events to listeners with specified context', () => {
    const emitter = new EventEmitter();
    const context = { _context: true };
    const listener = jest.fn(function listener() {
      expect(this).toBe(context);
    });
    emitter.addListener('test', listener, context);
    emitter.emit('test', 'value');
    expect(listener).toHaveBeenCalledWith('value');
  });

  it('emits events to listeners once with specified arguments', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.once('test', listener);
    emitter.emit('test', 1, 2, 3);
    emitter.emit('test', 1, 2, 3);
    expect(listener).toHaveBeenCalledWith(1, 2, 3);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('emits events to listeners once with specified context', () => {
    const emitter = new EventEmitter();
    const context = { _context: true };
    const listener = jest.fn(function listener() {
      expect(this).toBe(context);
    });
    emitter.once('test', listener, context);
    emitter.emit('test', 'value');
    expect(listener).toHaveBeenCalledWith('value');
  });

  it('allows removing current listener', () => {
    const emitter = new EventEmitter();
    const context = { _context: true };
    const listener = jest.fn(function listener() {
      emitter.removeCurrentListener();
    });
    emitter.once('test', listener, context);
    emitter.emit('test', 1);
    emitter.emit('test', 2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('throws when trying to remove current listener outside of emit context', () => {
    const emitter = new EventEmitter();
    expect(() => {
      emitter.removeCurrentListener();
    }).toThrow();
  });

  it('may remove all listeners for an event type', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.addListener('test', listener);
    emitter.removeAllListeners('test');
    emitter.emit('test', 1);
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('may remove all listeners', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.addListener('test', listener);
    emitter.removeAllListeners();
    emitter.emit('test', 1);
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('enumerates listeners for a given event type', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.addListener('test', listener);
    expect(emitter.listeners('test')).toEqual([listener]);
  });
});
