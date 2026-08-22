import { routingQueue } from '../routingQueue';

beforeEach(() => {
  routingQueue.queue = [];
  routingQueue.subscribers.clear();
});

describe('routingQueue', () => {
  it('adds intents and notifies subscribers', () => {
    const callback = jest.fn();
    routingQueue.subscribe(callback);

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    expect(routingQueue.snapshot()).toEqual([
      { type: 'ACTION', payload: { action: { type: 'GO_BACK' } } },
    ]);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes subscribers', () => {
    const callback = jest.fn();
    const unsubscribe = routingQueue.subscribe(callback);
    unsubscribe();

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    expect(callback).not.toHaveBeenCalled();
  });

  it('drains the current queue into a separate array', () => {
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } });
    const queued = routingQueue.snapshot();

    expect(routingQueue.drain(queued)).toEqual([
      { type: 'ACTION', payload: { action: { type: 'GO_BACK' } } },
      { type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } },
    ]);
    expect(routingQueue.snapshot()).not.toBe(queued);
    expect(routingQueue.snapshot()).toEqual([]);
  });

  it('does not drain a stale snapshot', () => {
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    const staleSnapshot = routingQueue.snapshot();
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } });
    const currentSnapshot = routingQueue.snapshot();

    expect(routingQueue.drain(staleSnapshot)).toEqual([]);
    expect(routingQueue.snapshot()).toBe(currentSnapshot);
  });

  it('does not notify subscribers when draining', () => {
    const callback = jest.fn();
    routingQueue.subscribe(callback);
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    const snapshot = routingQueue.snapshot();
    callback.mockClear();

    routingQueue.drain(snapshot);

    expect(callback).not.toHaveBeenCalled();
  });
});
