jest.mock('../module', () => ({
  __esModule: true,
  // Self-contained factory: jest hoists both this call and the imports below above any
  // top-level `const`, so the factory must not reference outer variables.
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

import AppMetricsModule from '../module';
import { recordSpan, startSpan, withSpan } from '../spans';

const mockModule = AppMetricsModule as unknown as {
  startSpan: jest.Mock;
  recordSpan: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
});

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
    expect(mockModule.recordSpan).toHaveBeenCalledWith('image-decode', {
      startTime: 1,
      endTime: 2,
      attributes: { format: 'avif' },
    });
  });
});
