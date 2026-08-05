import { installAbortSignalPatch } from '../AbortSignal';

const originalTimeout = AbortSignal.timeout;
const originalAny = AbortSignal.any;

function resetAbortSignalStatics() {
  Object.defineProperty(AbortSignal, 'timeout', {
    value: undefined,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  Object.defineProperty(AbortSignal, 'any', {
    value: undefined,
    configurable: true,
    enumerable: false,
    writable: true,
  });
}

function restoreAbortSignalStatics() {
  Object.defineProperty(AbortSignal, 'timeout', {
    value: originalTimeout,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  Object.defineProperty(AbortSignal, 'any', {
    value: originalAny,
    configurable: true,
    enumerable: false,
    writable: true,
  });
}

describe('AbortSignal patch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetAbortSignalStatics();
    installAbortSignalPatch(AbortSignal);
  });

  afterEach(() => {
    jest.useRealTimers();
    restoreAbortSignalStatics();
  });

  it('should install timeout and any when missing', () => {
    expect(AbortSignal.timeout).toEqual(expect.any(Function));
    expect(AbortSignal.any).toEqual(expect.any(Function));
  });

  it('should not override native timeout or any implementations', () => {
    const timeout = jest.fn();
    const any = jest.fn();

    Object.defineProperty(AbortSignal, 'timeout', {
      value: timeout,
      configurable: true,
    });
    Object.defineProperty(AbortSignal, 'any', {
      value: any,
      configurable: true,
    });

    installAbortSignalPatch(AbortSignal);

    expect(AbortSignal.timeout).toBe(timeout);
    expect(AbortSignal.any).toBe(any);
  });

  it('should abort timeout signal after delay with TimeoutError reason', () => {
    const signal = AbortSignal.timeout(10);
    const listener = jest.fn();

    signal.addEventListener('abort', listener);
    jest.advanceTimersByTime(9);

    expect(signal.aborted).toBe(false);
    expect(listener).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(signal.aborted).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(signal.reason).toBeInstanceOf(DOMException);
    expect(signal.reason.name).toBe('TimeoutError');
  });

  it('should reject invalid timeout values', () => {
    expect(() => AbortSignal.timeout(-1)).toThrow(RangeError);
    expect(() => AbortSignal.timeout(1.5)).toThrow(RangeError);
    expect(() => AbortSignal.timeout(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    // @ts-expect-error: Testing invalid usage
    expect(() => AbortSignal.timeout('1')).toThrow(TypeError);
  });

  it('should return non-aborted signal for empty any iterable', () => {
    const signal = AbortSignal.any([]);

    expect(signal.aborted).toBe(false);
  });

  it('should abort any signal when source is already aborted', () => {
    const reason = new Error('cancelled');
    const controller = new AbortController();

    controller.abort(reason);
    const signal = AbortSignal.any([controller.signal]);

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe(reason);
  });

  it('should abort any signal when any source aborts', () => {
    const reason = new Error('second');
    const firstController = new AbortController();
    const secondController = new AbortController();
    const signal = AbortSignal.any([firstController.signal, secondController.signal]);
    const listener = jest.fn();

    signal.addEventListener('abort', listener);
    secondController.abort(reason);

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe(reason);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(firstController.signal.aborted).toBe(false);
  });

  it('should preserve first abort reason for any signal', () => {
    const firstReason = new Error('first');
    const secondReason = new Error('second');
    const firstController = new AbortController();
    const secondController = new AbortController();
    const signal = AbortSignal.any([firstController.signal, secondController.signal]);

    secondController.abort(secondReason);
    firstController.abort(firstReason);

    expect(signal.reason).toBe(secondReason);
  });

  it('should remove source listeners after any signal aborts', () => {
    const firstController = new AbortController();
    const secondController = new AbortController();
    const removeFirstListener = jest.spyOn(firstController.signal, 'removeEventListener');
    const removeSecondListener = jest.spyOn(secondController.signal, 'removeEventListener');

    AbortSignal.any([firstController.signal, secondController.signal]);
    firstController.abort();

    expect(removeFirstListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(removeSecondListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('should reject invalid any iterable values', () => {
    // @ts-expect-error: Testing invalid usage
    expect(() => AbortSignal.any(null)).toThrow(TypeError);
    // @ts-expect-error: Testing invalid usage
    expect(() => AbortSignal.any([{}])).toThrow(TypeError);
  });
});
