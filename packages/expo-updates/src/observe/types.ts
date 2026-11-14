// The parts of the `expo-observe` integration API that the `expo-updates` integration uses. They
// are copied here because `expo-updates` cannot depend on `expo-observe`: `expo` depends on
// `expo-updates`, and `expo-observe` depends on `expo`, so the build graph would have a cycle. The
// shapes match `ObserveIntegration`, `ObserveIntegrationReporter` and
// `ObserveIntegrationRegistry` in `expo-observe`.

import type { UpdatesLogEntry } from '../Updates.types';

export type ReportOptions = {
  filterValue?: unknown;
  skipFilter?: boolean;
  limit?: string;
};

export type ObserveReporter = {
  storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string | null): Promise<void>;
  };
  reportError(
    report: { type: string; message: string; stack?: string; code?: string },
    options?: ReportOptions
  ): boolean;
  reportWarning(
    report: {
      name: string;
      displayName?: string;
      message: string;
      code?: string;
      attributes?: Record<string, string | number | boolean>;
    },
    options?: ReportOptions
  ): boolean;
};

export type ObserveIntegration = {
  name: string;
  configure(config: unknown, reporter: ObserveReporter): void;
  disable?(): void;
};

export type ObserveIntegrationRegistry = {
  integrations: ObserveIntegration[];
  onRegister?: (integration: ObserveIntegration) => void;
};

/**
 * The options of the `'expo-updates'` key in `Observe.configure({ integrations })`, which
 * `expo-observe` declares as `ObserveExpoUpdatesIntegrationConfig`. Only `reportWarnings` is read
 * here: `expo-observe` applies `ignoredCodes` and `shouldReport`.
 */
export type ExpoUpdatesIntegrationConfig = {
  reportWarnings?: boolean;
  shouldReport?: (entry: UpdatesLogEntry) => boolean;
};
