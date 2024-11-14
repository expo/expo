import { Telemetry } from '../Telemetry';

it('starts with default detached client', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });

  // Ensure the client is detached
  expect(telemetry['client'].strategy).toBe('detached');
});

it('waits until telemetry is initialized', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });
  const client = mockTelemetryClient(telemetry);

  // Record a simple event
  telemetry.record({ event: 'Start Project' });

  // Ensure the record was not recorded (yet)
  expect(client.record).not.toHaveBeenCalled();

  // Mark telemetry as initialized, to process the records
  telemetry.initialize({ userId: null });

  // Ensure there is no user hash for non-authenticated users
  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      userHash: null,
    }),
  ]);
});

it('preprocesses all records', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx', userId: 'yyy' });
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
      userHash: expect.any(String),
      context: expect.objectContaining({
        sessionId: expect.any(String),
      }),
    }),
  ]);

  // Ensure the user hash was used instead of the actual user id
  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      userHash: expect.not.stringMatching('yyy'),
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
