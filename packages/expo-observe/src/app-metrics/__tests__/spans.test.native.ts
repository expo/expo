import AppMetricsModule from '../module';
import { recordSpan, startSpan, withSpan } from '../spans';

jest.mock('../module', () => ({
  __esModule: true,
  // Self-contained factory: jest hoists this call above the imports and above any top-level
  // `const`, so the factory must not reference outer variables.
  default: {
    startSpan: jest.fn(() => ({
      traceId: 'a3ce929d0e0e4736a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      setAttributes: jest.fn(),
      addEvent: jest.fn(),
      end: jest.fn(),
    })),
    recordSpan: jest.fn(),
  },
}));

const mockModule = AppMetricsModule as unknown as {
  startSpan: jest.Mock;
  recordSpan: jest.Mock;
};

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

function mockSpanThatFailsToEnd() {
  mockModule.startSpan.mockReturnValueOnce({
    traceId: 'a3ce929d0e0e4736a3ce929d0e0e4736',
    spanId: '00f067aa0ba902b7',
    setAttributes: jest.fn(),
    addEvent: jest.fn(),
    end: jest.fn(() => {
      throw new Error('native object released');
    }),
  });
}

describe('startSpan', () => {
  it('folds the parent handle out of the options into the native argument', () => {
    const parent = startSpan('parent');
    startSpan('child', { attributes: { step: 1 }, parent, startTime: 123 });
    expect(mockModule.startSpan).toHaveBeenLastCalledWith(
      'child',
      { attributes: { step: 1 }, startTime: 123 },
      parent
    );
  });

  it('passes no parent for a root span', () => {
    startSpan('root');
    expect(mockModule.startSpan).toHaveBeenCalledWith('root', {}, undefined);
  });

  it('returns an inert span instead of throwing when the native call fails', () => {
    mockModule.startSpan.mockImplementationOnce(() => {
      throw new Error('native failure');
    });
    const span = startSpan('checkout');
    expect(span.traceId).toBe('0'.repeat(32));
    expect(span.spanId).toBe('0'.repeat(16));
    expect(() => {
      span.setAttributes({ step: 1 });
      span.addEvent('cart-validated');
      span.end();
    }).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('withSpan', () => {
  it('resolves to the callback result and ends the span without a status', async () => {
    const result = await withSpan('checkout', async (span) => {
      expect(span.traceId).toHaveLength(32);
      return 42;
    });
    expect(result).toBe(42);
    const span = mockModule.startSpan.mock.results[0]!.value;
    expect(span.end).toHaveBeenCalledTimes(1);
    expect(span.end).toHaveBeenCalledWith();
  });

  it('supports synchronous callbacks', async () => {
    const result = await withSpan('sync-work', () => 'done');
    expect(result).toBe('done');
    expect(mockModule.startSpan.mock.results[0]!.value.end).toHaveBeenCalledTimes(1);
  });

  it('ends the span as an error and rethrows when the callback throws', async () => {
    await expect(
      withSpan('checkout', async () => {
        throw new Error('card declined');
      })
    ).rejects.toThrow('card declined');
    const span = mockModule.startSpan.mock.results[0]!.value;
    expect(span.end).toHaveBeenCalledWith({ status: 'error', message: 'card declined' });
  });

  it('stringifies non-Error throwables into the status message', async () => {
    await expect(
      withSpan('checkout', () => {
        throw 'plain failure';
      })
    ).rejects.toBe('plain failure');
    const span = mockModule.startSpan.mock.results[0]!.value;
    expect(span.end).toHaveBeenCalledWith({ status: 'error', message: 'plain failure' });
  });

  it('still ends the span and rethrows the original when reading the message throws', async () => {
    // A throwable whose `message` getter throws would otherwise skip `end()` entirely and
    // replace the caller's error with the getter's, inside someone else's rejected promise.
    const hostile = new Error('original');
    Object.defineProperty(hostile, 'message', {
      get() {
        throw new Error('from the getter');
      },
    });
    await expect(
      withSpan('checkout', () => {
        throw hostile;
      })
    ).rejects.toBe(hostile);
    const span = mockModule.startSpan.mock.results[0]!.value;
    expect(span.end).toHaveBeenCalledWith({ status: 'error', message: undefined });
  });

  it('resolves to the callback result when ending the span throws', async () => {
    mockSpanThatFailsToEnd();
    await expect(withSpan('checkout', () => 42)).resolves.toBe(42);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('rethrows the callback error when ending the span throws', async () => {
    mockSpanThatFailsToEnd();
    const error = new Error('card declined');
    await expect(
      withSpan('checkout', () => {
        throw error;
      })
    ).rejects.toBe(error);
  });

  it('runs the callback when the span cannot start', async () => {
    mockModule.startSpan.mockImplementationOnce(() => {
      throw new Error('native failure');
    });
    const callback = jest.fn(() => 'done');
    await expect(withSpan('checkout', callback)).resolves.toBe('done');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('threads options through to the started span', async () => {
    await withSpan('checkout', () => null, { attributes: { step: 1 } });
    expect(mockModule.startSpan).toHaveBeenCalledWith(
      'checkout',
      { attributes: { step: 1 } },
      undefined
    );
  });
});

describe('recordSpan', () => {
  it('passes the measured window straight through', () => {
    recordSpan('image-decode', { startTime: 1, endTime: 2, attributes: { format: 'avif' } });
    expect(mockModule.recordSpan).toHaveBeenCalledWith(
      'image-decode',
      { startTime: 1, endTime: 2, attributes: { format: 'avif' } },
      undefined
    );
  });

  it('folds the parent handle out of the options into the native argument', () => {
    const parent = startSpan('checkout');
    recordSpan('image-decode', { startTime: 1, endTime: 2, parent });
    expect(mockModule.recordSpan).toHaveBeenCalledWith(
      'image-decode',
      { startTime: 1, endTime: 2 },
      parent
    );
  });

  it('does not throw when the native call fails', () => {
    mockModule.recordSpan.mockImplementationOnce(() => {
      throw new Error('native failure');
    });
    expect(() => recordSpan('image-decode', { startTime: 1, endTime: 2 })).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
