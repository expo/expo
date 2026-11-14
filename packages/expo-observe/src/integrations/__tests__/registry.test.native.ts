/* eslint-disable @typescript-eslint/no-require-imports */
import type { ObserveIntegration, ObserveIntegrationReporter } from '../../types';

const mockAppMetrics = {
  logEvent: jest.fn(),
  reportError: jest.fn(),
};

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: mockAppMetrics,
}));

type Registry = typeof import('../registry');

const REGISTRY_KEY = '__expo_observe_integrations__';

let registry: Registry;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  delete (globalThis as Record<string, unknown>)[REGISTRY_KEY];
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  registry = require('../registry');
});

afterEach(() => {
  warnSpy.mockRestore();
});

function createIntegration(name = 'test-library') {
  const reporters: ObserveIntegrationReporter[] = [];
  const integration = {
    name,
    configure: jest.fn((_config: unknown, reporter: ObserveIntegrationReporter) => {
      reporters.push(reporter);
    }),
    disable: jest.fn(),
  } satisfies ObserveIntegration;
  return { integration, reporter: () => reporters[reporters.length - 1]! };
}

describe('registration', () => {
  test('passes the original config, functions included, to an integration registered before configure', () => {
    const { integration } = createIntegration();
    registry.registerObserveIntegration(integration);
    const shouldReport = () => true;

    registry.configureRegisteredIntegrations({ 'test-library': { shouldReport } } as never);

    expect(integration.configure).toHaveBeenCalledTimes(1);
    expect(integration.configure.mock.calls[0]![0]).toEqual({ shouldReport });
    expect(
      (integration.configure.mock.calls[0]![0] as { shouldReport: unknown }).shouldReport
    ).toBe(shouldReport);
  });

  test('configures an integration registered after configure with the latest config', () => {
    registry.configureRegisteredIntegrations({ 'test-library': true } as never);
    const { integration } = createIntegration();

    registry.registerObserveIntegration(integration);

    expect(integration.configure).toHaveBeenCalledWith(true, expect.any(Object));
  });

  test('does not configure an integration that the config leaves out', () => {
    const { integration } = createIntegration();
    registry.registerObserveIntegration(integration);

    registry.configureRegisteredIntegrations({});

    expect(integration.configure).not.toHaveBeenCalled();
    expect(integration.disable).not.toHaveBeenCalled();
  });

  test('disables an enabled integration when a later configure leaves it out', () => {
    const { integration } = createIntegration();
    registry.registerObserveIntegration(integration);
    registry.configureRegisteredIntegrations({ 'test-library': true } as never);

    registry.configureRegisteredIntegrations({});

    expect(integration.disable).toHaveBeenCalledTimes(1);
  });

  test('works with a library that uses the global registry without importing expo-observe', () => {
    const configure = jest.fn();
    const global = globalThis as Record<string, any>;
    global[REGISTRY_KEY] ??= { integrations: [] };
    const integration = { name: 'test-library', configure };
    global[REGISTRY_KEY].integrations.push(integration);
    global[REGISTRY_KEY].onRegister?.(integration);

    registry.configureRegisteredIntegrations({ 'test-library': true } as never);

    expect(configure).toHaveBeenCalledTimes(1);
  });

  test('keeps configuring other integrations when one throws', () => {
    const throwing = {
      name: 'throwing',
      configure: jest.fn(() => {
        throw new Error('boom');
      }),
    };
    const { integration } = createIntegration();
    registry.registerObserveIntegration(throwing);
    registry.registerObserveIntegration(integration);

    registry.configureRegisteredIntegrations({ throwing: true, 'test-library': true } as never);

    expect(integration.configure).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'throwing' integration"));
  });
});

describe('reporter', () => {
  function enabled(config: unknown = true) {
    const { integration, reporter } = createIntegration();
    registry.registerObserveIntegration(integration);
    registry.configureRegisteredIntegrations({ 'test-library': config } as never);
    return reporter();
  }

  test('reports an error with the integration source and the code', () => {
    const reporter = enabled();

    const sent = reporter.reportError({
      type: 'test.error',
      message: 'Failed',
      code: 'FailedToLoad',
    });

    expect(sent).toBe(true);
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'integration',
        type: 'test.error',
        message: 'Failed',
        code: 'FailedToLoad',
        isFatal: false,
      })
    );
  });

  test('sends no code when the report has none', () => {
    enabled().reportError({ type: 'test.error', message: 'Failed' });

    expect(mockAppMetrics.reportError.mock.calls[0]![0]).not.toHaveProperty('code');
  });

  test('skips a report whose code is in ignoredCodes', () => {
    const reporter = enabled({ ignoredCodes: ['Ignored'] });

    expect(reporter.reportError({ type: 'test.error', message: 'a', code: 'Ignored' })).toBe(false);
    expect(reporter.reportError({ type: 'test.error', message: 'b', code: 'Other' })).toBe(true);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
  });

  test('passes filterValue to shouldReport, and skips the report when it returns false', () => {
    const shouldReport = jest.fn(() => false);
    const reporter = enabled({ shouldReport });

    const sent = reporter.reportError(
      { type: 'test.error', message: 'a' },
      { filterValue: { entry: 1 } }
    );

    expect(sent).toBe(false);
    expect(shouldReport).toHaveBeenCalledWith({ entry: 1 });
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });

  test('sends the report and warns once when shouldReport throws', () => {
    const reporter = enabled({
      shouldReport: () => {
        throw new Error('bad filter');
      },
    });

    reporter.reportError({ type: 'test.error', message: 'a' });
    reporter.reportError({ type: 'test.error', message: 'b' });

    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test('skipFilter sends a report that the filter would skip', () => {
    const reporter = enabled({ ignoredCodes: ['Ignored'], shouldReport: () => false });

    expect(
      reporter.reportError(
        { type: 'test.error', message: 'a', code: 'Ignored' },
        { skipFilter: true }
      )
    ).toBe(true);
  });

  test('reports a distinct message once in the rate limit window', () => {
    const reporter = enabled();

    expect(reporter.reportError({ type: 'test.error', message: 'same' })).toBe(true);
    expect(reporter.reportError({ type: 'test.error', message: 'same' })).toBe(false);
  });

  test('counts each limit on its own', () => {
    const reporter = enabled();
    for (let i = 0; i < 20; i++) {
      reporter.reportError({ type: 'test.error', message: `error ${i}` });
    }

    expect(reporter.reportError({ type: 'test.error', message: 'error 20' })).toBe(false);
    expect(
      reporter.reportError({ type: 'test.error', message: 'error 20' }, { limit: 'recovery' })
    ).toBe(true);
  });

  test('reports a warning as an event with the code and the capped message', () => {
    const reporter = enabled();

    reporter.reportWarning({
      name: 'test.warning',
      displayName: 'Test warning',
      message: 'x'.repeat(600),
      code: 'Slow',
      attributes: { updateId: 'abc' },
    });

    expect(mockAppMetrics.logEvent).toHaveBeenCalledWith('test.warning', {
      displayName: 'Test warning',
      body: 'x'.repeat(600),
      severity: 'warn',
      attributes: { updateId: 'abc', message: 'x'.repeat(500), code: 'Slow' },
    });
  });

  test('sends nothing after the integration is disabled', () => {
    const reporter = enabled();
    registry.configureRegisteredIntegrations({});

    expect(reporter.reportError({ type: 'test.error', message: 'a' })).toBe(false);
    expect(reporter.reportWarning({ name: 'test.warning', message: 'a' })).toBe(false);
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
    expect(mockAppMetrics.logEvent).not.toHaveBeenCalled();
  });
});
