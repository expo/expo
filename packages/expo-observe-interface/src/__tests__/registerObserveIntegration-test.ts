import { requireOptionalNative } from 'expo';

import { registerObserveIntegration } from '..';

jest.mock('expo', () => ({ requireOptionalNative: jest.fn() }));

type Apply = (
  configJson: string | null,
  client: ReturnType<typeof createNativeClient> | null
) => void;

function mockNativeHost(apiVersion = 1) {
  const applies = new Map<string, Apply>();
  const host = {
    apiVersion,
    register: jest.fn((name: string, apply: Apply) => {
      applies.set(name, apply);
    }),
  };
  jest.mocked(requireOptionalNative).mockReturnValue({ ObserveIntegrations: host });
  return { host, applies };
}

function createNativeClient() {
  return {
    reportError: jest.fn(() => true),
    reportWarning: jest.fn(() => true),
    logEvent: jest.fn(() => true),
  };
}

let warn: jest.SpyInstance;

beforeEach(() => {
  jest.mocked(requireOptionalNative).mockReset();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

it('does nothing when expo-observe is not installed', () => {
  jest.mocked(requireOptionalNative).mockReturnValue(null);
  const setup = jest.fn();

  expect(() => registerObserveIntegration({ name: 'my-library', setup })).not.toThrow();
  expect(requireOptionalNative).toHaveBeenCalledWith('expo-observe');
  expect(setup).not.toHaveBeenCalled();
});

it('does nothing when expo-observe has no integrations module', () => {
  jest.mocked(requireOptionalNative).mockReturnValue({});

  expect(() => registerObserveIntegration({ name: 'my-library', setup: jest.fn() })).not.toThrow();
});

it('does not register with an expo-observe that uses another API version', () => {
  const { host } = mockNativeHost(2);

  registerObserveIntegration({ name: 'my-library', setup: jest.fn() });

  expect(host.register).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('integration API version 2'));
});

it('sets up the integration with the parsed config and a client', () => {
  const { host, applies } = mockNativeHost();
  const setup = jest.fn();
  const nativeClient = createNativeClient();

  registerObserveIntegration<{ level: number }>({ name: 'my-library', setup });
  expect(host.register).toHaveBeenCalledWith('my-library', expect.any(Function));
  applies.get('my-library')!('{"level":1}', nativeClient);

  expect(setup).toHaveBeenCalledTimes(1);
  const { config, observe } = setup.mock.calls[0][0];
  expect(config).toEqual({ level: 1 });

  const error = { type: 'my-library.error', message: 'boom', code: 'Code' };
  expect(observe.reportError(error)).toBe(true);
  expect(nativeClient.reportError).toHaveBeenCalledWith(error);
  const warning = { name: 'my-library.warning', message: 'slow' };
  expect(observe.reportWarning(warning)).toBe(true);
  expect(nativeClient.reportWarning).toHaveBeenCalledWith(warning);
  const event = { name: 'my-library.event', body: 'body', severity: 'debug' as const };
  expect(observe.logEvent(event)).toBe(true);
  expect(nativeClient.logEvent).toHaveBeenCalledWith(event);
});

it('tears down before each new setup and when the integration is turned off', () => {
  const { applies } = mockNativeHost();
  const calls: string[] = [];
  registerObserveIntegration<{ level: number }>({
    name: 'my-library',
    setup({ config }) {
      calls.push(`setup ${config.level}`);
      return () => calls.push(`teardown ${config.level}`);
    },
  });
  const apply = applies.get('my-library')!;

  apply('{"level":1}', createNativeClient());
  apply('{"level":2}', createNativeClient());
  apply(null, null);
  apply(null, null);

  expect(calls).toEqual(['setup 1', 'teardown 1', 'setup 2', 'teardown 2']);
});

it('catches the errors that setup and the teardown throw', () => {
  const { applies } = mockNativeHost();
  let shouldSetupThrow = true;
  registerObserveIntegration({
    name: 'my-library',
    setup() {
      if (shouldSetupThrow) {
        throw new Error('setup failed');
      }
      return () => {
        throw new Error('teardown failed');
      };
    },
  });
  const apply = applies.get('my-library')!;

  expect(() => apply('{}', createNativeClient())).not.toThrow();
  shouldSetupThrow = false;
  expect(() => apply('{"changed":true}', createNativeClient())).not.toThrow();
  expect(() => apply(null, null)).not.toThrow();

  expect(warn).toHaveBeenCalledTimes(2);
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining("`setup` of the 'my-library' integration"),
    expect.objectContaining({ message: 'setup failed' })
  );
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining("`teardown` of the 'my-library' integration"),
    expect.objectContaining({ message: 'teardown failed' })
  );
});

it('returns false when the native client rejects a report', () => {
  const { applies } = mockNativeHost();
  const setup = jest.fn();
  const nativeClient = createNativeClient();
  nativeClient.reportError.mockImplementation(() => {
    throw new TypeError('wrong attribute type');
  });
  registerObserveIntegration({ name: 'my-library', setup });
  applies.get('my-library')!('{}', nativeClient);
  const { observe } = setup.mock.calls[0][0];

  expect(observe.reportError({ type: 'my-library.error', message: 'boom' })).toBe(false);
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining("'my-library' integration could not call `reportError`"),
    expect.any(TypeError)
  );
});
