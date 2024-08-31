import { Telemetry } from '../Telemetry';

it('starts with default detached client', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });

  // Ensure the client is detached
  expect(telemetry['client'].strategy).toBe('detached');
});

it('preprocesses all records', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });
  const client = mockTelemetryClient(telemetry);

  // Record a simple event
  telemetry.record({ event: 'Start Project' });

  // Ensure the record was preprocessed
  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      type: 'track',
      event: 'Start Project',
      sentAt: expect.any(Date),
      messageId: expect.any(String),
      anonymousId: 'xxx',
      context: expect.objectContaining({
        sessionId: expect.any(String),
      }),
    }),
  ]);
});

it('flushes all pending records', async () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });
  const client = mockTelemetryClient(telemetry);

  // Tell the client to flush
  await telemetry.flush();

  // Ensure the client was flushed
  expect(client.flush).toHaveBeenCalled();
});

it('switches strategy to detached before exiting', async () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });
  const client = mockTelemetryClient(telemetry);

  // Fake pending records
  client.abort.mockReturnValue([{ event: 'Start Project' }]);

  // Ensure we are using the mocked test client
  expect(telemetry['client']).toBe(client);

  // Tell the client to flush on exit
  await telemetry.flushOnExit();

  // Ensure the client was flushed
  expect(telemetry['client'].strategy).toBe('detached');
});

function mockTelemetryClient(telemetry: Telemetry) {
  const client: any = {
    strategy: 'test',
    abort: jest.fn(),
    record: jest.fn(),
    flush: jest.fn(),
  };

  telemetry['client'] = client;

  return client;
}
