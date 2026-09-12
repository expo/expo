import { recordMetric } from '../recordMetric';

const metric = {
  timestamp: '2026-01-01T00:00:00.000Z',
  category: 'navigation',
  name: 'warm_ttr',
  routeName: '/a',
  value: 0.1,
  params: {},
} as const;

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

it('forwards the metric to the session', async () => {
  const addMetric = jest.fn().mockResolvedValue(undefined);

  await recordMetric({ addMetric }, metric);

  expect(addMetric).toHaveBeenCalledWith(metric);
  expect(warnSpy).not.toHaveBeenCalled();
});

it('resolves and warns when the write rejects', async () => {
  const error = new Error('Cannot use shared object that was already released');
  const addMetric = jest.fn().mockRejectedValue(error);

  await expect(recordMetric({ addMetric }, metric)).resolves.toBeUndefined();

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[expo-observe]'), error);
});

it('resolves and warns when the write throws synchronously', async () => {
  const error = new Error('boom');
  const addMetric = jest.fn(() => {
    throw error;
  });

  await expect(recordMetric({ addMetric }, metric)).resolves.toBeUndefined();

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[expo-observe]'), error);
});

it('stays silent outside development', async () => {
  const dev = __DEV__;
  (globalThis as any).__DEV__ = false;
  try {
    await recordMetric({ addMetric: jest.fn().mockRejectedValue(new Error('boom')) }, metric);
  } finally {
    (globalThis as any).__DEV__ = dev;
  }

  expect(warnSpy).not.toHaveBeenCalled();
});
