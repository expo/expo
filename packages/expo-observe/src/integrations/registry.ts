import AppMetrics from 'expo-app-metrics';

import { reportCaughtError } from '../reportCaughtError';
import type {
  ObserveIntegration,
  ObserveIntegrationErrorReport,
  ObserveIntegrationFilterConfig,
  ObserveIntegrationRegistry,
  ObserveIntegrationReporter,
  ObserveIntegrationReportOptions,
  ObserveIntegrationStorage,
  ObserveIntegrationWarningReport,
  ObserveIntegrationsConfig,
} from '../types';
import { createReportLimiter, type ReportLimiter } from './reportLimiter';

/**
 * The `globalThis` key of the integration registry. A library registers its integration here
 * without importing `expo-observe`, so the library works whether or not `expo-observe` is
 * installed, and in either load order.
 */
export const OBSERVE_INTEGRATION_REGISTRY_KEY = '__expo_observe_integrations__';

type RegistryGlobal = typeof globalThis & {
  [OBSERVE_INTEGRATION_REGISTRY_KEY]?: ObserveIntegrationRegistry;
};

type ActiveIntegration = {
  integration: ObserveIntegration;
  reporter: ObserveIntegrationReporter;
  // The config the integration was last configured with, or `undefined` while it is disabled.
  config: unknown;
};

/**
 * Returns the shared registry, creating it when no library and no earlier `expo-observe` copy has.
 */
export function getIntegrationRegistry(): ObserveIntegrationRegistry {
  const global = globalThis as RegistryGlobal;
  global[OBSERVE_INTEGRATION_REGISTRY_KEY] ??= { integrations: [] };
  return global[OBSERVE_INTEGRATION_REGISTRY_KEY];
}

/**
 * Registers an integration that lives in another library. The integration's `configure` runs with
 * the original object from `Observe.configure({ integrations })`, functions included, each time
 * `configure` enables it, and `disable` runs when a later `configure` turns it off. A library that
 * does not depend on `expo-observe` does the same with the registry at
 * `globalThis.__expo_observe_integrations__`: create it as `{ integrations: [] }` when it is
 * missing, push the integration, and call `onRegister` when it is set.
 */
export function registerObserveIntegration(integration: ObserveIntegration): void {
  const registry = getIntegrationRegistry();
  registry.integrations.push(integration);
  registry.onRegister?.(integration);
}

/**
 * The native functions that keep each integration's strings, which are not public API.
 */
export type IntegrationValueStore = {
  getIntegrationValue(integration: string, key: string): Promise<string | null>;
  setIntegrationValue(integration: string, key: string, value: string | null): Promise<void>;
};

// Only one `expo-observe` copy configures the registry, so this state is per module instance.
const active = new Map<ObserveIntegration, ActiveIntegration>();
let latestIntegrations: ObserveIntegrationsConfig | null = null;
let valueStore: IntegrationValueStore | null = null;

function createStorage(name: string): ObserveIntegrationStorage {
  return {
    async getItem(key) {
      return valueStore ? ((await valueStore.getIntegrationValue(name, key)) ?? null) : null;
    },
    async setItem(key, value) {
      await valueStore?.setIntegrationValue(name, key, value);
    },
  };
}

function filterConfigOf(config: unknown): ObserveIntegrationFilterConfig {
  return typeof config === 'object' && config !== null
    ? (config as ObserveIntegrationFilterConfig)
    : {};
}

function createReporter(name: string, getConfig: () => unknown): ObserveIntegrationReporter {
  const limiters = new Map<string, ReportLimiter>();
  let hasWarnedAboutShouldReport = false;

  function limiterFor(key: string): ReportLimiter {
    let limiter = limiters.get(key);
    if (!limiter) {
      limiter = createReportLimiter();
      limiters.set(key, limiter);
    }
    return limiter;
  }

  function passesFilter(
    code: string | undefined,
    defaultValue: unknown,
    options: ObserveIntegrationReportOptions | undefined
  ): boolean {
    if (options?.skipFilter) {
      return true;
    }
    const { ignoredCodes, shouldReport } = filterConfigOf(getConfig());
    if (code !== undefined && ignoredCodes?.includes(code)) {
      return false;
    }
    if (typeof shouldReport !== 'function') {
      return true;
    }
    try {
      return shouldReport(options && 'filterValue' in options ? options.filterValue : defaultValue);
    } catch (error) {
      if (!hasWarnedAboutShouldReport) {
        hasWarnedAboutShouldReport = true;
        console.warn(
          `[expo-observe] The '${name}' integration's \`shouldReport\` function threw, so the ` +
            'report is sent. Fix the function so that it returns a boolean. ' +
            `Error: ${String(error)}`
        );
      }
      return true;
    }
  }

  return {
    storage: createStorage(name),
    reportError(report: ObserveIntegrationErrorReport, options?: ObserveIntegrationReportOptions) {
      if (getConfig() === undefined || !passesFilter(report.code, report, options)) {
        return false;
      }
      if (limiterFor(options?.limit ?? 'error').allow(report.message) === null) {
        return false;
      }
      const error = new Error(report.message);
      error.name = report.type;
      error.stack = report.stack;
      reportCaughtError(error, 'integration', report.code);
      return true;
    },
    reportWarning(
      report: ObserveIntegrationWarningReport,
      options?: ObserveIntegrationReportOptions
    ) {
      if (getConfig() === undefined || !passesFilter(report.code, report, options)) {
        return false;
      }
      const cappedMessage = limiterFor(options?.limit ?? 'warning').allow(report.message);
      if (cappedMessage === null) {
        return false;
      }
      AppMetrics.logEvent(report.name, {
        displayName: report.displayName,
        body: report.message,
        severity: 'warn',
        // `eas observe:events` and `observe:session` show `attributes` but not `body`, so the
        // message is copied here to stay queryable.
        attributes: {
          ...report.attributes,
          message: cappedMessage,
          ...(report.code !== undefined ? { code: report.code } : {}),
        },
      });
      return true;
    },
  };
}

function apply(entry: ActiveIntegration, integrations: ObserveIntegrationsConfig): void {
  const config = (integrations as Record<string, unknown>)[entry.integration.name];
  const wasEnabled = entry.config !== undefined;
  if (config) {
    entry.config = config;
    callSafely(entry.integration, 'configure', () =>
      entry.integration.configure(config, entry.reporter)
    );
  } else if (wasEnabled) {
    entry.config = undefined;
    callSafely(entry.integration, 'disable', () => entry.integration.disable?.());
  }
}

function callSafely(integration: ObserveIntegration, hook: string, call: () => void): void {
  try {
    call();
  } catch (error) {
    console.warn(
      `[expo-observe] The '${integration.name}' integration's \`${hook}\` threw: ${String(error)}`
    );
  }
}

function activate(integration: ObserveIntegration): ActiveIntegration {
  let entry = active.get(integration);
  if (!entry) {
    const created: ActiveIntegration = {
      integration,
      config: undefined,
      reporter: createReporter(integration.name, () => created.config),
    };
    active.set(integration, created);
    entry = created;
  }
  return entry;
}

/**
 * Passes the `integrations` object of a `configure` call to every registered library integration,
 * and to each integration that registers later. `store` keeps the integrations' strings; without
 * it, as on web, nothing is stored.
 */
export function configureRegisteredIntegrations(
  integrations: ObserveIntegrationsConfig,
  store: IntegrationValueStore | null = null
): void {
  latestIntegrations = integrations;
  valueStore = store;
  const registry = getIntegrationRegistry();
  registry.onRegister = (integration) => {
    if (latestIntegrations) {
      apply(activate(integration), latestIntegrations);
    }
  };
  for (const integration of registry.integrations) {
    apply(activate(integration), integrations);
  }
}
