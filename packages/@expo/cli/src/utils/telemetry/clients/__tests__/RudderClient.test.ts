import type RudderAnalytics from '@expo/rudder-sdk-node';

import type { TelemetryRecordInternal } from '../../types';
import { RudderClient } from '../RudderClient';

jest.mock('@expo/rudder-sdk-node');

it('throws when aborting', () => {
  const client = new RudderClient(mockRudderAnalytics());
  expect(() => client.abort()).toThrow('Cannot abort Rudderstack client records');
});

it('passes records to rudderstack', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  // Create dummy events
  const records = [
    createRecord({ event: 'Start Project' }),
    createRecord({ event: 'Serve Manifest' }),
    createRecord({ event: 'Open Url on Device' }),
  ];

  // Record the events
  await client.record(records);

  // Ensure the events are passed to the SDK
  for (const record of records) {
    expect(sdk.track).toHaveBeenCalledWith(record);
  }
});

it('passes flush to rudderstack', async () => {
  const sdk = mockRudderAnalytics();
  const client = new RudderClient(sdk);

  // Flush the client
  await client.flush();

  // Ensure the flush is passed to the SDK
  expect(sdk.flush).toHaveBeenCalled();
});

/** Create a stub that looks like the Rudderstack client */
function mockRudderAnalytics(): RudderAnalytics {
  return {
    track: jest.fn(),
    flush: jest.fn(),
  } as any;
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
