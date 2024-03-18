import { spawn } from 'child_process';
import { vol } from 'memfs';

import { type Actor } from '../../../api/user/user';
import { DetachedClient } from '../DetachedClient';

jest.mock('fs');
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({ unref: jest.fn() })),
}));
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
  vol.fromJSON({ '/home/user/.expo/state.json': JSON.stringify({}) });

  const actor = { id: 'fake', __typename: 'User' } as Actor;
  const client = new DetachedClient();
  await Promise.all([
    client.identify(actor),
    client.record('Start Project'),
    client.record('Serve Manifest'),
    client.record('Open Url on Device'),
  ]);
  await client.flush();

  expect(vol.toJSON()).toMatchObject({
    '/home/user/.expo/.telemetry.json': JSON.stringify({
      actor,
      records: [
        { event: 'Start Project', properties: undefined },
        { event: 'Serve Manifest', properties: undefined },
        { event: 'Open Url on Device', properties: undefined },
      ],
    }),
  });
});

it('flushes in detached process', async () => {
  const childRef = { unref: jest.fn() };

  jest.mocked(spawn).mockReturnValue(childRef as any);
  vol.fromJSON({ '/home/user/.expo/state.json': JSON.stringify({}) });

  const client = new DetachedClient();
  await client.record('Start Project');
  await client.flush();

  expect(childRef.unref).toHaveBeenCalled();
  expect(spawn).toHaveBeenCalledWith(
    expect.any(String),
    [expect.any(String), '/home/user/.expo/.telemetry.json'],
    {
      detached: true,
      shell: false,
      stdio: 'ignore',
      windowsHide: true,
    }
  );
});

it('skips flushing when no events are recorded', async () => {
  const client = new DetachedClient();
  await client.flush();

  expect(spawn).not.toHaveBeenCalled();
});
