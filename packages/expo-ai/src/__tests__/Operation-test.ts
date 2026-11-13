import { LanguageModelError } from '../LanguageModelError';
import { createOperation } from '../Operation';
import { LegacyAbortController } from './fixtures/LegacyAbortController';

const operations: ReturnType<typeof createOperation>[] = [];
function operation(signal?: AbortSignal, timeoutMs?: number) {
  const result = createOperation(signal, timeoutMs);
  operations.push(result);
  return result;
}
afterEach(() => {
  for (const active of operations.splice(0)) active.close();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('operation', () => {
  it('preserves cancellation and timeout errors when AbortController has no reason support', async () => {
    jest.useFakeTimers();
    jest.spyOn(globalThis, 'AbortController').mockImplementation(() => new LegacyAbortController());
    const active = operation(undefined, 10);
    const request = active.run(() => new Promise(() => {}));
    const rejected = expect(request).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
    await Promise.resolve();
    jest.advanceTimersByTime(10);
    await rejected;
    expect(active.signal.reason).toBeUndefined();
    expect(() => active.check()).toThrow(expect.objectContaining({ code: 'ERR_TIMEOUT' }));
    const external = new LegacyAbortController();
    external.abort();
    await expect(operation(external.signal).run(() => 'unreachable')).rejects.toMatchObject({
      code: 'ERR_ABORTED',
    });
    const disposed = operation();
    disposed.abort(new LanguageModelError('ERR_SESSION_DISPOSED', 'Disposed.'));
    expect(() => disposed.check()).toThrow(
      expect.objectContaining({ code: 'ERR_SESSION_DISPOSED' })
    );
  });

  it.each([0, -1, 2147483648, 1.5, NaN, Infinity, null])(
    'rejects invalid deadlines: %p',
    (timeoutMs) => {
      expect(() => createOperation(undefined, timeoutMs as number)).toThrow(
        expect.objectContaining({ code: 'ERR_OPTIONS_INVALID' })
      );
    }
  );

  it('rejects invalid cancellation signals', () => {
    expect(() => createOperation({} as AbortSignal)).toThrow(
      expect.objectContaining({ code: 'ERR_OPTIONS_INVALID' })
    );
    expect(() => createOperation(null as unknown as AbortSignal)).toThrow(
      expect.objectContaining({ code: 'ERR_OPTIONS_INVALID' })
    );
  });

  it('never starts work for an already-aborted signal', async () => {
    const work = jest.fn();
    const active = operation(AbortSignal.abort('left'));
    await expect(active.run(work)).rejects.toMatchObject({ code: 'ERR_ABORTED', cause: 'left' });
    expect(work).not.toHaveBeenCalled();
  });

  it('preserves ordinary callback errors', async () => {
    const failure = new Error('Provider failed.');
    const active = operation();
    await expect(
      active.run(() => {
        throw failure;
      })
    ).rejects.toBe(failure);
    await expect(active.run(() => 'next')).resolves.toBe('next');
  });

  it('propagates external cancellation while uncooperative work is pending', async () => {
    const controller = new AbortController();
    const active = operation(controller.signal);
    const request = active.run(() => new Promise(() => {}));
    const rejected = expect(request).rejects.toMatchObject({
      code: 'ERR_ABORTED',
      cause: 'cancel',
    });
    await Promise.resolve();
    controller.abort('cancel');
    await rejected;
    expect(active.signal.aborted).toBe(true);
  });

  it('times out uncooperative asynchronous work and clears its timer', async () => {
    jest.useFakeTimers();
    const active = operation(undefined, 10);
    const pending = active.run(() => new Promise(() => {}));
    const rejected = expect(pending).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
    await Promise.resolve();
    jest.advanceTimersByTime(10);
    await rejected;
    expect(jest.getTimerCount()).toBe(0);
  });

  it('checks elapsed time when synchronous work prevented the timer from running', async () => {
    const active = operation(undefined, 5);
    await expect(
      active.run(() => {
        const until = performance.now() + 15;
        while (performance.now() < until) {
          /* Simulate a synchronous application callback. */
        }
        return 'too late';
      })
    ).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
    const next = jest.fn();
    await expect(active.run(next)).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
    expect(next).not.toHaveBeenCalled();
  });

  it('preserves a disposal error supplied by the owner', async () => {
    const active = operation();
    const failure = new LanguageModelError('ERR_SESSION_DISPOSED', 'Disposed.');
    active.abort(failure);
    await expect(active.run(() => 1)).rejects.toBe(failure);
  });

  it('normalizes ordinary abort reasons and keeps the first reason', () => {
    const active = operation();
    const failure = new Error('Stopped.');
    active.abort(failure);
    active.abort(new Error('Later.'));
    expect(active.signal.reason).toMatchObject({ code: 'ERR_ABORTED', cause: failure });
  });

  it('close aborts pending work and prevents any new work', async () => {
    const active = operation();
    const pending = active.run(() => new Promise(() => {}));
    const rejected = expect(pending).rejects.toMatchObject({ code: 'ERR_ABORTED' });
    await Promise.resolve();
    active.close();
    await rejected;
    const next = jest.fn();
    await expect(active.run(next)).rejects.toMatchObject({ code: 'ERR_ABORTED' });
    expect(next).not.toHaveBeenCalled();
  });

  it('cleans up external and per-run listeners without aborting successful work', async () => {
    jest.useFakeTimers();
    const controller = new AbortController();
    const addExternal = jest.spyOn(controller.signal, 'addEventListener');
    const removeExternal = jest.spyOn(controller.signal, 'removeEventListener');
    const active = operation(controller.signal);
    const add = jest.spyOn(active.signal, 'addEventListener');
    const remove = jest.spyOn(active.signal, 'removeEventListener');
    await expect(active.run(() => active.run(() => 42))).resolves.toBe(42);
    active.close();
    active.close();
    expect(active.signal.aborted).toBe(false);
    expect(removeExternal).toHaveBeenCalledWith('abort', addExternal.mock.calls[0]![1]);
    for (const call of add.mock.calls) expect(remove).toHaveBeenCalledWith('abort', call[1]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('continues observing work that rejects after cancellation', async () => {
    const active = operation();
    let rejectWork!: (error: Error) => void;
    const request = active.run(
      () =>
        new Promise((_, reject) => {
          rejectWork = reject;
        })
    );
    const rejected = expect(request).rejects.toMatchObject({ code: 'ERR_ABORTED' });
    await Promise.resolve();
    active.abort();
    await rejected;
    rejectWork(new Error('Late native failure.'));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
