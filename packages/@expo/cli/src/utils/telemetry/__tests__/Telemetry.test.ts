import { Telemetry } from '../Telemetry';
import { commandEvent } from '../events';
import { getAgentTelemetryContext } from '../utils/agent';
import { getSandboxTelemetryContext } from '../utils/sandbox';

jest.mock('../utils/agent', () => ({
  getAgentTelemetryContext: jest.fn(),
}));
jest.mock('../utils/sandbox', () => ({
  getSandboxTelemetryContext: jest.fn(),
}));

const getAgentTelemetryContextMock = getAgentTelemetryContext as jest.MockedFunction<
  typeof getAgentTelemetryContext
>;
const getSandboxTelemetryContextMock = getSandboxTelemetryContext as jest.MockedFunction<
  typeof getSandboxTelemetryContext
>;

beforeEach(() => {
  getAgentTelemetryContextMock.mockReset();
  getAgentTelemetryContextMock.mockReturnValue(null);
  getSandboxTelemetryContextMock.mockReset();
  getSandboxTelemetryContextMock.mockReturnValue('unknown');
});

it('starts with default detached client', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });

  // Ensure the client is detached
  expect(telemetry['client'].strategy).toBe('detached');
});

it('waits until telemetry is initialized', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx' });
  const client = mockTelemetryClient(telemetry);

  // Record a simple event
  telemetry.record(commandEvent('start'));

  // Ensure the record was not recorded (yet)
  expect(client.record).not.toHaveBeenCalled();

  // Mark telemetry as initialized, to process the records
  telemetry.initialize({ userId: null });

  // Ensure there is no user hash for non-authenticated users
  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      userHash: null,
      context: expect.not.objectContaining({ agent: expect.anything() }),
    }),
  ]);
});

it('preprocesses all records', () => {
  const telemetry = new Telemetry({ anonymousId: 'xxx', userId: 'yyy' });
  const client = mockTelemetryClient(telemetry);

  // Record a simple event
  telemetry.record(commandEvent('start'));

  // Ensure the record was preprocessed
  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      type: 'track',
      event: 'action',
      sentAt: expect.any(Date),
      messageId: expect.any(String),
      anonymousId: 'xxx',
      userHash: expect.any(String),
      context: expect.objectContaining({
        sessionId: expect.any(String),
        sandbox_id: 'unknown',
      }),
    }),
  ]);
  expect(client.record.mock.calls[0][0][0].context).not.toHaveProperty('agent');

  // Ensure the user hash was used instead of the actual user id
  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      userHash: expect.not.stringMatching('yyy'),
    }),
  ]);
});

it('adds detected agent context to all records', () => {
  getAgentTelemetryContextMock.mockReturnValue({ id: 'codex', sessionId: 'zzz' });

  const telemetry = new Telemetry({ anonymousId: 'xxx', userId: 'yyy' });
  const client = mockTelemetryClient(telemetry);

  telemetry.record(commandEvent('start'));

  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      context: expect.objectContaining({
        agent: {
          id: 'codex',
          sessionId: 'zzz',
        },
      }),
    }),
  ]);
});

it('adds detected sandbox context to all records', () => {
  getSandboxTelemetryContextMock.mockReturnValue('e2b');

  const telemetry = new Telemetry({ anonymousId: 'xxx', userId: 'yyy' });
  const client = mockTelemetryClient(telemetry);

  telemetry.record(commandEvent('start'));

  expect(client.record).toHaveBeenCalledWith([
    expect.objectContaining({
      context: expect.objectContaining({
        sandbox_id: 'e2b',
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
  client.abort.mockReturnValue([commandEvent('start')]);

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
