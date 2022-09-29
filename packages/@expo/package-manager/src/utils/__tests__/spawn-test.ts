import spawnAsync from '@expo/spawn-async';

import { mockSpawnPromise, STUB_SPAWN_CHILD, STUB_SPAWN_RESULT } from '../../__tests__/spawn-utils';
import { createPendingSpawnAsync } from '../spawn';

jest.mock('@expo/spawn-async');

const mockedSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

describe(createPendingSpawnAsync, () => {
  it('creates a promise with pending child promise', async () => {
    const pending = createPendingSpawnAsync(
      () => Promise.resolve(),
      () => spawnAsync('foo', ['bar'])
    );

    expect(pending).toHaveProperty('child', expect.any(Promise));
  });

  it('pipes return of async action to spawn action', async () => {
    const pending = createPendingSpawnAsync(
      () => Promise.resolve(['custom', 'flags']),
      (flags) => spawnAsync('foo', flags)
    );

    await pending;
    expect(mockedSpawnAsync).toBeCalledWith('foo', ['custom', 'flags']);
  });

  it('pending promises resolves when both actions resolves', async () => {
    const pending = createPendingSpawnAsync(
      () => Promise.resolve(),
      () => spawnAsync('foo', ['bar'])
    );

    await expect(pending).resolves.toMatchObject(STUB_SPAWN_RESULT);
    await expect(pending.child).resolves.toMatchObject(STUB_SPAWN_CHILD);
  });

  it('pending child promise resolves to `null` when async action rejects', async () => {
    const error = new Error('foo');
    const pending = createPendingSpawnAsync(
      () => Promise.reject(error),
      () => spawnAsync('foo', ['bar'])
    );

    await expect(pending.child).resolves.toBeNull();
    await expect(pending).rejects.toBe(error);
  });

  it('pending promise rejects when spawn action rejects', async () => {
    const error = new Error('foo');
    mockedSpawnAsync.mockImplementation(() => mockSpawnPromise(Promise.reject(error)));

    const pending = createPendingSpawnAsync(
      () => Promise.resolve(['other', 'custom', 'flags']),
      (flags) => spawnAsync('foo', flags)
    );

    await expect(pending).rejects.toBe(error);
    await expect(pending.child).resolves.toMatchObject(STUB_SPAWN_CHILD);

    expect(mockedSpawnAsync).toBeCalledWith('foo', ['other', 'custom', 'flags']);
  });
});
