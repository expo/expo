import type { Span } from '../Span';
import { recordMetric } from '../metrics';
import AppMetricsModule from '../module';

jest.mock('../module', () => ({
  __esModule: true,
  default: { recordMetric: jest.fn() },
}));

const mockModule = AppMetricsModule as unknown as { recordMetric: jest.Mock };

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('recordMetric', () => {
  it('passes the name, value, and options to the native module', () => {
    recordMetric('checkout.payment_time', 120, { unit: 'ms', attributes: { method: 'card' } });
    expect(mockModule.recordMetric).toHaveBeenCalledWith(
      'checkout.payment_time',
      120,
      { unit: 'ms', attributes: { method: 'card' } },
      undefined
    );
  });

  it('folds the span out of the options into the native argument', () => {
    const span = { traceId: 'a3ce929d0e0e4736a3ce929d0e0e4736', spanId: '00f067aa0ba902b7' };
    recordMetric('checkout.items', 3, { unit: '{item}', span: span as unknown as Span });
    expect(mockModule.recordMetric).toHaveBeenCalledWith(
      'checkout.items',
      3,
      { unit: '{item}' },
      span
    );
  });

  it('warns instead of throwing when the native call fails', () => {
    mockModule.recordMetric.mockImplementationOnce(() => {
      throw new Error('Cannot convert value');
    });
    expect(() => recordMetric('checkout.payment_time', 120)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      '[expo-observe] recordMetric could not record the metric:',
      expect.any(Error)
    );
  });
});
