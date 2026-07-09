import { NativeModule, registerWebModule } from 'expo';
import AppMetrics, { type LogEventOptions, type MetricAttributes } from 'expo-app-metrics';

import type {
  ObserveConfig,
  ObserveIntegrationsConfig,
  ObserveModule,
  ObserveModuleEvents,
  ObserveAttributes,
} from './types';
import { getAppConfig } from './web/appConfig';
import { toLogsRequest, type OTAttribute } from './web/otlp';

const DEFAULT_ENDPOINT_URL = 'https://o.expo.dev';
const DISPATCH_INTERVAL_MS = 30_000;
const CLIENT_ID_STORAGE_KEY = 'expo-observe.client-id';

// Remembered so a browser without usable storage still reports one id per page load.
let volatileClientId: string | null = null;

/**
 * Stable per-installation id, persisted in local storage. Fills the role of
 * `expo-eas-client`'s client id, which has no web implementation.
 */
function getClientId(): string {
  try {
    const stored = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (stored) {
      return stored;
    }
    const clientId = generateClientId();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    return clientId;
  } catch {
    // Local storage can be unavailable (privacy modes, storage quotas).
    volatileClientId ??= generateClientId();
    return volatileClientId;
  }
}

function generateClientId(): string {
  // ponytail: Math.random fallback for insecure contexts; collision odds are
  // irrelevant for a telemetry cohort id.
  return globalThis.crypto?.randomUUID?.() ?? `${Math.random().toString(36).slice(2)}${Date.now()}`;
}

/** 32-bit FNV-1a hash, used to derive a deterministic per-installation sampling bucket. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class ExpoObserveModule extends NativeModule<ObserveModuleEvents> implements ObserveModule {
  private config: ObserveConfig = {};
  private environmentDefault: string | undefined;
  private isJsDev = typeof __DEV__ !== 'undefined' && !!__DEV__;
  private dispatchCursor = 0;
  private scheduled = false;
  private warnedMissingProjectId = false;

  async dispatchEvents() {
    await this.flush(false);
  }
  configure(config: ObserveConfig): void {
    this.config = config;
    if (this.scheduled || typeof window === 'undefined') {
      return;
    }
    this.scheduled = true;
    setInterval(() => {
      this.flush(false);
    }, DISPATCH_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });
  }
  getIntegrations(): ObserveIntegrationsConfig {
    return this.config.integrations ?? {};
  }
  logEvent(name: string, options?: LogEventOptions): void {
    AppMetrics.logEvent(name, options);
  }
  markFirstRender(): void {
    AppMetrics.markFirstRender();
  }
  markInteractive(attributes?: MetricAttributes): void {
    AppMetrics.markInteractive(attributes);
  }
  setGlobalAttributes(attributes?: ObserveAttributes | null): void {
    AppMetrics.setGlobalAttributes(attributes);
  }
  setBundleDefaults(defaults: { environment: string; isJsDev: boolean }): void {
    this.environmentDefault = defaults.environment;
    this.isJsDev = defaults.isJsDev;
  }

  private async flush(useKeepalive: boolean): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    const session = AppMetrics.getMainSession();
    const allLogs = await session.getLogs();
    // `clearStoredEntries()` can shrink the queue below the cursor.
    this.dispatchCursor = Math.min(this.dispatchCursor, allLogs.length);
    const pending = allLogs.slice(this.dispatchCursor);
    if (pending.length === 0) {
      return;
    }
    // ponytail: the cursor advances before the POST — at-most-once delivery with no
    // retry, so a batch is lost on a transient network failure. Native likewise drops
    // batches on non-retryable errors; add a retry gate if web deliverability starts
    // to matter. Advancing here also marks records as sent when a gate below skips
    // dispatch, matching native semantics.
    this.dispatchCursor = allLogs.length;

    if (this.config.dispatchingEnabled === false) {
      return;
    }
    if (this.isJsDev && !this.config.dispatchInDebug) {
      return;
    }
    const sampleRate = this.config.sampleRate;
    if (
      sampleRate != null &&
      fnv1a(getClientId()) / 2 ** 32 >= Math.min(Math.max(sampleRate, 0), 1)
    ) {
      return;
    }

    const appConfig = getAppConfig();
    const projectId = appConfig?.extra?.eas?.projectId;
    if (!projectId) {
      if (!this.warnedMissingProjectId) {
        this.warnedMissingProjectId = true;
        console.warn(
          '[expo-observe] Log events will not be dispatched on web because the app config has no EAS project ID. Run `eas init` (or set `extra.eas.projectId` in your app config) and rebuild to enable dispatching.'
        );
      }
      return;
    }
    const endpointUrl = appConfig?.extra?.eas?.observe?.endpointUrl ?? DEFAULT_ENDPOINT_URL;

    fetch(`${endpointUrl}/${projectId}/v1/logs`, {
      method: 'POST',
      // `keepalive` lets the request outlive the page but caps the body at ~64 KB,
      // so only the tab-hidden flush sets it.
      keepalive: useKeepalive,
      headers: {
        'Content-Type': 'application/json',
        // Keeps our own uploads out of the network-request observer, like native.
        'Expo-AppMetrics-Skip': '1',
      },
      body: JSON.stringify(toLogsRequest(pending, session.id, this.resourceAttributes())),
    }).catch(() => {
      // Fire-and-forget: a failed batch is dropped (see the cursor comment above).
    });
  }

  private resourceAttributes(): OTAttribute[] {
    const attributes: OTAttribute[] = [
      { key: 'telemetry.sdk.name', value: { stringValue: 'expo-observe' } },
      { key: 'telemetry.sdk.language', value: { stringValue: 'webjs' } },
      { key: 'browser.language', value: { stringValue: navigator.language } },
      { key: 'expo.eas_client.id', value: { stringValue: getClientId() } },
    ];
    const environment = this.config.environment ?? this.environmentDefault;
    if (environment) {
      attributes.push({ key: 'expo.environment', value: { stringValue: environment } });
    }
    return attributes;
  }
}

export default registerWebModule(ExpoObserveModule, 'ExpoObserve');
