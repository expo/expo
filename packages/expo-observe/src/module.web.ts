import { NativeModule, registerWebModule } from 'expo';
import AppMetrics, {
  type LogEventOptions,
  type LogRecord,
  type MetricAttributes,
} from 'expo-app-metrics';
import Constants from 'expo-constants';

import { applyConfig } from './applyConfig';
import { buildLogsRequestBody, type OTLogsRequestBody } from './otlp';
import { registerIntegrationImpl } from './registerIntegration';
import { reportCaughtError } from './reportCaughtError';
import type {
  ObserveConfig,
  ObserveIntegrationsConfig,
  ObserveModule,
  ObserveModuleEvents,
  ObserveAttributes,
} from './types';

const defaultEndpointUrl = 'https://o.expo.dev';
// Retry timing per the OTLP guidance, matching the native dispatchers: exponential backoff with
// full jitter when the server sends no `Retry-After`, bounded so a long outage never snoozes
// dispatch for hours.
const backoffBaseMs = 60_000;
const backoffCapMs = 900_000;
const sampleValueStorageKey = 'dev.expo.observe.sampleValue';
// `resolveJsonModule` is off in the module tsconfig, so the version is read at runtime.
const sdkVersion: string = require('../package.json').version;

type BundleDefaults = { environment: string; isJsDev: boolean };
type EasExtra = { projectId?: string; observe?: { endpointUrl?: string } } | undefined;

type SendResult =
  | { kind: 'accepted' }
  | { kind: 'retry'; retryAfterMs: number | null }
  | { kind: 'rejected'; reason: string };

// Falls back to a per-page value when storage is unavailable (for example in private browsing).
let inMemorySampleValue: number | undefined;

function getSampleValue(): number {
  try {
    const stored = localStorage.getItem(sampleValueStorageKey);
    if (stored !== null) {
      return Number(stored);
    }
    const value = Math.random();
    localStorage.setItem(sampleValueStorageKey, String(value));
    return value;
  } catch {
    inMemorySampleValue ??= Math.random();
    return inMemorySampleValue;
  }
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) {
    return null;
  }
  const seconds = Number(header);
  const delayMs = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
  if (Number.isNaN(delayMs)) {
    return null;
  }
  return Math.min(Math.max(delayMs, backoffBaseMs), backoffCapMs);
}

async function sendRequest(
  url: string,
  body: OTLogsRequestBody,
  keepalive: boolean
): Promise<SendResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive,
    });
  } catch {
    return { kind: 'retry', retryAfterMs: null };
  }
  if (response.status >= 200 && response.status < 300) {
    return { kind: 'accepted' };
  }
  if ([429, 502, 503, 504].includes(response.status)) {
    return { kind: 'retry', retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')) };
  }
  // Unlike native, a 413 drops the batch instead of retrying smaller ones.
  const excerpt = (await response.text().catch(() => '')).slice(0, 512);
  return { kind: 'rejected', reason: `HTTP ${response.status}${excerpt ? `: ${excerpt}` : ''}` };
}

class ExpoObserveModule extends NativeModule<ObserveModuleEvents> implements ObserveModule {
  private lastIntegrations: ObserveIntegrationsConfig = {};
  private config: ObserveConfig = {};
  private bundleDefaults: BundleDefaults | null = null;
  // Records the server accepted or that were given up on. They stay in the store so `getLogs()`
  // keeps returning the whole session, like native.
  private dispatched = new WeakSet<LogRecord>();
  private retryAfter = 0;
  private consecutiveRetryableFailures = 0;
  // Serializes dispatch passes so overlapping calls never send the same records twice.
  private dispatchChain: Promise<void> = Promise.resolve();
  private warnedAboutProjectId = false;

  constructor() {
    super();
    if (typeof document !== 'undefined') {
      // The page may be gone before a regular request completes, so these flushes use `keepalive`.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.dispatch(true);
        }
      });
      window.addEventListener('pagehide', () => {
        this.dispatch(true);
      });
    }
  }

  get clientId(): string | null {
    // The EAS client id is stored in native preferences, which web has no equivalent of.
    return null;
  }
  dispatchEvents(): Promise<void> {
    return this.dispatch(false);
  }
  configure(config: ObserveConfig): void {
    applyConfig(config);
    this.config = config;
    // Broadcast the integrations config so integration libraries (e.g. expo-image) can activate.
    this.lastIntegrations = { ...config.integrations };
    this.emit('configure', { integrations: this.lastIntegrations });
  }
  getIntegrations(): ObserveIntegrationsConfig {
    return this.lastIntegrations;
  }
  registerIntegration<K extends keyof ObserveIntegrationsConfig>(
    name: K,
    callback: (config: ObserveIntegrationsConfig[K]) => void
  ): void {
    registerIntegrationImpl(this, name, callback);
  }
  logEvent(name: string, options?: LogEventOptions): void {
    AppMetrics.logEvent(name, options);
  }
  reportError(error: unknown): void {
    reportCaughtError(error);
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
  setBundleDefaults(defaults: BundleDefaults): void {
    this.bundleDefaults = defaults;
  }

  private dispatch(keepalive: boolean): Promise<void> {
    const run = () => this.dispatchPendingLogs(keepalive);
    this.dispatchChain = this.dispatchChain.then(run, run);
    return this.dispatchChain;
  }

  private async dispatchPendingLogs(keepalive: boolean): Promise<void> {
    // Nothing is stored during server rendering.
    if (typeof window === 'undefined') {
      return;
    }
    const endpointUrl = this.getLogsEndpointUrl();
    if (!endpointUrl || Date.now() < this.retryAfter) {
      return;
    }

    const session = AppMetrics.getMainSession();
    const pending = (await session.getLogs()).filter((record) => !this.dispatched.has(record));
    if (pending.length === 0) {
      return;
    }
    if (!this.shouldDispatch()) {
      // Records that will never be sent are marked as sent so they don't pile up, like native.
      pending.forEach((record) => this.dispatched.add(record));
      return;
    }

    const body = buildLogsRequestBody({
      sessionId: session.id,
      sdkVersion,
      resourceAttributes: this.getResourceAttributes(),
      logs: pending,
    });
    const result = await sendRequest(endpointUrl, body, keepalive);
    if (result.kind === 'retry') {
      this.consecutiveRetryableFailures++;
      const backoff = Math.min(
        backoffBaseMs * 2 ** (this.consecutiveRetryableFailures - 1),
        backoffCapMs
      );
      this.retryAfter = Date.now() + (result.retryAfterMs ?? backoff * Math.random());
      return;
    }
    this.consecutiveRetryableFailures = 0;
    pending.forEach((record) => this.dispatched.add(record));
    if (result.kind === 'rejected') {
      console.warn(
        `[expo-observe] Dropping ${pending.length} log record(s) the server refused: ${result.reason}`
      );
    }
  }

  private shouldDispatch(): boolean {
    const dispatchingEnabled = this.config.dispatchingEnabled ?? true;
    const dispatchInDebug = this.config.dispatchInDebug ?? false;
    const isDev = this.bundleDefaults?.isJsDev ?? false;
    return dispatchingEnabled && this.isInSample() && (!isDev || dispatchInDebug);
  }

  private isInSample(): boolean {
    const rate = this.config.sampleRate;
    if (rate == null) {
      return true;
    }
    return getSampleValue() < Math.min(Math.max(rate, 0), 1);
  }

  private getLogsEndpointUrl(): string | null {
    // `extra` is untyped in the config, so narrow it to the EAS keys read here.
    const eas = Constants.expoConfig?.extra?.eas as EasExtra;
    if (!eas?.projectId) {
      if (!this.warnedAboutProjectId) {
        this.warnedAboutProjectId = true;
        console.warn(
          '[expo-observe] Log events are not dispatched on web because `extra.eas.projectId` is missing from the app config. Run `eas init` to link the project, so the events can be sent to EAS Observe.'
        );
      }
      return null;
    }
    const baseUrl = (eas.observe?.endpointUrl ?? defaultEndpointUrl).replace(/\/+$/, '');
    return `${baseUrl}/${eas.projectId}/v1/logs`;
  }

  private getResourceAttributes(): Record<string, string | undefined> {
    const expoConfig = Constants.expoConfig;
    return {
      'telemetry.sdk.name': 'expo-observe',
      'telemetry.sdk.version': sdkVersion,
      'telemetry.sdk.language': 'webjs',
      'browser.language': navigator.language,
      'user_agent.original': navigator.userAgent,
      'service.name': expoConfig?.slug,
      'service.version': expoConfig?.version,
      'expo.app.name': expoConfig?.name,
      'expo.sdk.version': expoConfig?.sdkVersion,
      'expo.environment': this.config.environment ?? this.bundleDefaults?.environment,
    };
  }
}

export default registerWebModule(ExpoObserveModule, 'ExpoObserve');
