import { Log } from '../../../../log';
import { event, isWatchEnabled, prewarmTransformPool } from '../instantiateMetro';

jest.mock('../../../../log');
jest.mock(
  '@expo/metro/metro-config/defaults/getMaxWorkers',
  () => (workers?: number) => workers ?? 2
);

describe(prewarmTransformPool, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('warms every transform worker', async () => {
    const done = jest.fn();
    jest.spyOn(event, 'span').mockReturnValue(done as any);
    const transformFile = jest.fn().mockResolvedValue(undefined);

    await prewarmTransformPool({ transformFile } as any, 2);

    expect(transformFile).toHaveBeenCalledTimes(2);
    expect(transformFile.mock.calls.map(([filePath]) => filePath)).toEqual([
      '/__prewarm__/0.js',
      '/__prewarm__/1.js',
    ]);
    expect(transformFile.mock.calls[0][1]).toMatchObject({
      customTransformOptions: {
        prewarm: '1',
        bytecode: '1',
        engine: 'hermes',
      },
      dev: true,
      minify: false,
      platform: 'ios',
      type: 'module',
      unstable_transformProfile: 'hermes-stable',
    });
    expect(transformFile.mock.calls[0][2]).toBeInstanceOf(Buffer);
    expect(done).toHaveBeenCalledWith('prewarm', { workers: 2 });
  });

  it('skips prewarming when Metro uses one worker', async () => {
    const span = jest.spyOn(event, 'span');
    const transformFile = jest.fn();

    await prewarmTransformPool({ transformFile } as any, 1);

    expect(transformFile).not.toHaveBeenCalled();
    expect(span).not.toHaveBeenCalled();
  });

  it('settles synchronous and asynchronous transform errors', async () => {
    const done = jest.fn();
    jest.spyOn(event, 'span').mockReturnValue(done as any);
    const transformFile = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('synchronous transform error');
      })
      .mockRejectedValueOnce(new Error('asynchronous transform error'));

    await expect(prewarmTransformPool({ transformFile } as any, 2)).resolves.toBeUndefined();

    expect(transformFile).toHaveBeenCalledTimes(2);
    expect(done).toHaveBeenCalledWith('prewarm', { workers: 2 });
  });
});

describe(isWatchEnabled, () => {
  const originalValue = process.env.CI;

  beforeEach(() => {
    delete process.env.CI;
  });

  afterEach(() => {
    process.env.CI = originalValue;
  });

  it('is enabled without CI', () => {
    expect(isWatchEnabled()).toBe(true);
  });

  it('is enabled with CI=false', () => {
    process.env.CI = 'false';
    expect(isWatchEnabled()).toBe(true);
  });

  it('is disabled with CI=true', () => {
    process.env.CI = 'true';
    expect(isWatchEnabled()).toBe(false);
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Metro is running in CI mode'));
  });
});
