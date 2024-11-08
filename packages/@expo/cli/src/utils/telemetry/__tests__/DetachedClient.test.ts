import { spawn } from 'child_process';
import { vol } from 'memfs';

import { type Actor } from '../../../api/user/user';
import { DetachedClient } from '../DetachedClient';

jest.mock('fs');
jest.mock('child_process', () => ({ spawn: jest.fn(() => ({ unref: jest.fn() })) }));
jest.mock('tempy', () => ({ file: jest.fn(() => '/tmp/expo-telemetry.json') }));
jest.mock('../../../api/user/UserSettings', () => ({
  getDirectory: jest.fn(() => '/home/user/.expo'),
}));

afterEach(() => vol.reset());

it('stores identify information', async () => {
  const client = new DetachedClient();
  const actor = { id: 'fake', __typename: 'User' } as Actor;

  expect(client.isIdentified).toBe(false);
  await client.identify(actor);
  expect(client.isIdentified).toBe(true);
});

it('stores all recorded events to json file', async () => {
  vol.fromJSON({});

  const actor = { id: 'fake', __typename: 'User' } as Actor;
  const client = new DetachedClient();
  await Promise.all([
    client.identify(actor),
    client.record({ event: 'Start Project' }),
    client.record({ event: 'Serve Manifest' }),
    client.record({ event: 'Open Url on Device' }),
  ]);
  await client.flush();

  const file = vol.readFileSync('/tmp/expo-telemetry.json', 'utf8');
  expect(JSON.parse(file.toString())).toMatchObject({
    actor,
    records: [
      { event: 'Start Project', originalTimestamp: expect.any(String) },
      { event: 'Serve Manifest', originalTimestamp: expect.any(String) },
      { event: 'Open Url on Device', originalTimestamp: expect.any(String) },
    ],
  });
});

it('flushes in detached process', async () => {
  const spawnChild = { unref: jest.fn() };

  jest.mocked(spawn).mockReturnValue(spawnChild as any);
  vol.fromJSON({});

  const client = new DetachedClient();
  await client.record({ event: 'Start Project' });
  await client.flush();

  expect(spawnChild.unref).toHaveBeenCalled();
  expect(spawn).toHaveBeenCalledWith(
    expect.any(String),
    [expect.any(String), '/tmp/expo-telemetry.json'],
    {
      detached: true,
      shell: false,
      stdio: 'ignore',
      windowsHide: true,
    }
  );
});

it("doesn't throw when the spawn fails with an exception", async () => {
  // Mock the `spawn` method
  jest.mocked(spawn).mockImplementation(() => {
    throw new Error('Failed to spawn');
  });
  vol.fromJSON({});

  // Create a client, record an event, and flush it
  const client = new DetachedClient();
  await client.record({ event: 'Start Project' });

  await expect(client.flush()).resolves.not.toThrow();
  expect(spawn).toThrow();
});

it('skips flushing when no events are recorded', async () => {
  const client = new DetachedClient();
  await client.flush();

  expect(spawn).not.toHaveBeenCalled();
});
