import { Log } from '../../../../log';
import {
  event,
  isWatchEnabled,
  moveHmrClientGroupToRevision,
  prewarmTransformPool,
} from '../instantiateMetro';

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

describe(moveHmrClientGroupToRevision, () => {
  function createClientGroup(revisionId: string) {
    const client = { optedIntoHMR: true, revisionIds: [revisionId], sendFn: jest.fn() };
    const group = {
      clients: new Set([client]),
      clientUrl: new URL('http://localhost:8081/index.bundle?platform=ios'),
      revisionId,
      unlisten: jest.fn(),
      graphOptions: { lazy: false, shallow: false },
    };
    return { client, group };
  }

  it('moves a registered group and its clients to the new revision', () => {
    const { client, group } = createClientGroup('rev0');
    const clientGroups = new Map([['rev0', group]]);

    moveHmrClientGroupToRevision(clientGroups, group, 'rev1');

    expect([...clientGroups]).toEqual([['rev1', group]]);
    expect(client.revisionIds).toEqual(['rev1']);
  });

  it('does not add back a group whose last client disconnected during the update', () => {
    const { client, group } = createClientGroup('rev0');
    const clientGroups = new Map([['rev0', group]]);
    // Metro's `onClientDisconnect` removes a group, and stops it listening, with its last client.
    group.clients.delete(client);
    clientGroups.delete('rev0');

    moveHmrClientGroupToRevision(clientGroups, group, 'rev1');

    expect(clientGroups.size).toBe(0);
  });
});
