import { vol } from 'memfs';
import { spawn } from 'node:child_process';

import { commandEvent } from '../../events';
import type { TelemetryRecordInternal } from '../../types';
import { FetchDetachedClient } from '../FetchDetachedClient';

jest.mock('fs');
jest.mock('node:fs', () => require('memfs').fs);
jest.mock('node:child_process', () => ({ spawn: jest.fn(() => ({ unref: jest.fn() })) }));

afterEach(() => vol.reset());

it('returns all events when aborting', () => {
  const client = new FetchDetachedClient();

  // Record dummy events
  client.record([
    createRecord(commandEvent('install')),
    createRecord(commandEvent('config')),
    createRecord(commandEvent('start')),
  ]);

  // Abort and ensure the events are returned
  const records = client.abort();
  expect(records).toHaveLength(3);
});

it('stores all recorded events to json file', async () => {
  const client = new FetchDetachedClient();

  // Record dummy events
  client.record([
    createRecord(commandEvent('install')),
    createRecord(commandEvent('config')),
    createRecord(commandEvent('start')),
  ]);

  // Flush events and store them
  await client.flush();

  // Ensure the events are stored, with their `originalTimestamp`
  const file = vol.readFileSync('/tmp/expo-telemetry.json', 'utf8');
  expect(JSON.parse(file.toString())).toMatchObject({
    records: [
      {
        event: 'action',
        properties: { action: 'expo install' },
        originalTimestamp: expect.any(String),
      },
      {
        event: 'action',
        properties: { action: 'expo config' },
        originalTimestamp: expect.any(String),
      },
      {
        event: 'action',
        properties: { action: 'expo start' },
        originalTimestamp: expect.any(String),
      },
    ],
  });
});

it('flushes in detached process', async () => {
  const spawnChild = { unref: jest.fn() };

  // Mock the `spawn` method
  jest.mocked(spawn).mockReturnValue(spawnChild as any);
  vol.fromJSON({});

  // Create a client, record an event, and flush it
  const client = new FetchDetachedClient();
  await client.record([createRecord(commandEvent('start'))]);
  await client.flush();

  // Ensure the child process was spawned with the correct arguments
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
  const client = new FetchDetachedClient();
  await client.record([createRecord(commandEvent('start'))]);

  await expect(client.flush()).resolves.not.toThrow();
  expect(spawn).toThrow();
});

it('skips flushing when no events are recorded', async () => {
  // Create a client, and flush it without recording any events
  const client = new FetchDetachedClient();
  await client.flush();

  // Ensure the child process was not spawned
  expect(spawn).not.toHaveBeenCalled();
});

/** Create a fake record using partial data */
function createRecord(partial: Partial<TelemetryRecordInternal>): TelemetryRecordInternal {
  return {
    type: 'track',
    event: 'action',
    messageId: '1',
    anonymousId: 'xxx',
    context: {
      sessionId: 'yyy',
    },
    sentAt: new Date(),
    ...partial,
  };
}
