import { setTimeout } from 'node:timers/promises';

import type { TelemetryRecordInternal } from '../../types';
import { FetchClient } from '../FetchClient';

describe(FetchClient, () => {
  it('returns all events when aborting', async () => {
    const fetch = mockFetch();
    const client = new FetchClient({ fetch });

    // Create a batch of records
    const records = [
      createRecord({ event: 'Start Project' }),
      createRecord({ event: 'Serve Manifest' }),
      createRecord({ event: 'Open Url on Device' }),
    ];

    // Record dummy events, without awaiting
    client.record(records);

    // Abort all pending events
    const aborted = client.abort();

    // Ensure all events are returned
    expect(aborted).toHaveLength(3);
    expect(aborted).toMatchObject(records);
  });

  it('records and send events immediately', async () => {
    const fetch = mockFetch();
    const client = new FetchClient({ fetch });
    const record = createRecord({ event: 'Start Project' });

    // Record a single dummy event
    await client.record([record]);

    // Ensure the event is sent through fetch
    expect(fetch).toHaveBeenCalled();
    // Ensure the body contains the record
    expect(JSON.parse((jest.mocked(fetch).mock.calls![0][1] as any).body)).toMatchObject({
      sentAt: expect.any(String),
      batch: [{ ...record, sentAt: expect.any(String) }],
    });
  });

  it('records attaches controller to abort requests', async () => {
    const fetch = mockFetch();
    const client = new FetchClient({ fetch });

    // Record a single dummy event
    await client.record([createRecord({ event: 'Start Project' })]);

    // Ensure the controller is attached to the request
    expect((jest.mocked(fetch).mock.calls[0][1] as any).signal).toBeDefined();
  });

  it('does not send empty records', async () => {
    const fetch = mockFetch();
    const client = new FetchClient({ fetch });

    // Record an empty batch
    await client.record([]);

    // Ensure no fetch request was made
    expect(fetch).not.toHaveBeenCalled();
  });

  it('flushes all pending events', async () => {
    // Keep track of the resolved count
    let resolved = 0;

    const fetch: any = jest.fn(() => setTimeout(10, { ok: true }).then(() => resolved++));
    const client = new FetchClient({ fetch });

    // Record dummy events, without awaiting, in two batches
    client.record([createRecord({ event: 'Start Project' })]);
    client.record([
      createRecord({ event: 'Serve Manifest' }),
      createRecord({ event: 'Open Url on Device' }),
    ]);

    // Wait until all events are flushed
    await client.flush();

    // Ensure both batches are awaited
    expect(resolved).toBe(2);
  });
});

function mockFetch(): typeof fetch {
  return jest.fn().mockResolvedValue({ ok: true });
}

/** Create a fake record using partial data */
function createRecord(partial: Partial<TelemetryRecordInternal>): TelemetryRecordInternal {
  return {
    type: 'track',
    event: 'Start Project',
    messageId: '1',
    anonymousId: 'xxx',
    context: {
      sessionId: 'yyy',
    },
    sentAt: new Date(),
    ...partial,
  };
}
