import Constants from 'expo-constants';

import type { ObserveConfig } from '../types';
import { buildLogsRequestBody } from './otlp';
import { getPendingLogs, removeLogs, sessionId } from './storage';
import type { BundleDefaults, EasExtra, OTLogsRequestBody, SendResult } from './types';

const defaultEndpointUrl = 'https://o.expo.dev';
// Retry timing per the OTLP guidance, matching the native dispatchers: exponential backoff with
// full jitter when the server sends no `Retry-After`, bounded so a long outage never snoozes
// dispatch for hours.
const backoffBaseMs = 60_000;
const backoffCapMs = 900_000;
const sampleValueStorageKey = 'dev.expo.observe.sampleValue';
// `resolveJsonModule` is off in the module tsconfig, so the version is read at runtime.
const sdkVersion: string = require('../../package.json').version;

let config: ObserveConfig = {};
let bundleDefaults: BundleDefaults | null = null;
let retryAfter = 0;
let consecutiveRetryableFailures = 0;
// Serializes dispatch passes so overlapping calls never send the same records twice.
let dispatchChain: Promise<void> = Promise.resolve();
let warnedAboutProjectId = false;
// Falls back to a per-page value when storage is unavailable (for example in private browsing).
let inMemorySampleValue: number | undefined;

export function setDispatchConfig(nextConfig: ObserveConfig): void {
  config = nextConfig;
}

export function setDispatchBundleDefaults(defaults: BundleDefaults): void {
  bundleDefaults = defaults;
}

/**
 * Sends the pending log records to the EAS Observe logs endpoint. Resolves once the pass is done;
 * a call made while another pass is running waits for it first.
 */
export function dispatch(): Promise<void> {
  return enqueueDispatch(false);
}

if (typeof document !== 'undefined') {
  // The page may be gone before a regular request completes, so these flushes use `keepalive`.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      enqueueDispatch(true);
    }
  });
  window.addEventListener('pagehide', () => {
    enqueueDispatch(true);
  });
}

function enqueueDispatch(keepalive: boolean): Promise<void> {
  const run = () => dispatchPendingLogs(keepalive);
  dispatchChain = dispatchChain.then(run, run);
  return dispatchChain;
}

async function dispatchPendingLogs(keepalive: boolean): Promise<void> {
  // Nothing is stored during server rendering.
  if (!config.web || typeof window === 'undefined') {
    return;
  }
  const endpointUrl = getLogsEndpointUrl();
  if (!endpointUrl || Date.now() < retryAfter) {
    return;
  }

  const pending = getPendingLogs();
  if (pending.length === 0) {
    return;
  }
  if (!shouldDispatch()) {
    // Records that will never be sent are dropped so they don't pile up, like native advancing
    // its cursor past them.
    removeLogs(pending);
    return;
  }

  const body = buildLogsRequestBody({
    sessionId,
    sdkVersion,
    resourceAttributes: getResourceAttributes(),
    logs: pending,
  });
  const result = await sendRequest(endpointUrl, body, keepalive);
  if (result.kind === 'retry') {
    consecutiveRetryableFailures++;
    const backoff = Math.min(backoffBaseMs * 2 ** (consecutiveRetryableFailures - 1), backoffCapMs);
    retryAfter = Date.now() + (result.retryAfterMs ?? backoff * Math.random());
    return;
  }
  consecutiveRetryableFailures = 0;
  removeLogs(pending);
  if (result.kind === 'rejected') {
    console.warn(
      `[expo-observe] Dropping ${pending.length} log record(s) the server refused: ${result.reason}`
    );
  }
}

function shouldDispatch(): boolean {
  const dispatchingEnabled = config.dispatchingEnabled ?? true;
  const dispatchInDebug = config.dispatchInDebug ?? false;
  const isDev = bundleDefaults?.isJsDev ?? false;
  return dispatchingEnabled && isInSample() && (!isDev || dispatchInDebug);
}

function isInSample(): boolean {
  const rate = config.sampleRate;
  if (rate == null) {
    return true;
  }
  return getSampleValue() < Math.min(Math.max(rate, 0), 1);
}

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

function getLogsEndpointUrl(): string | null {
  // `extra` is untyped in the config, so narrow it to the EAS keys read here.
  const eas = Constants.expoConfig?.extra?.eas as EasExtra;
  if (!eas?.projectId) {
    if (!warnedAboutProjectId) {
      warnedAboutProjectId = true;
      console.warn(
        '[expo-observe] Log events are not dispatched on web because `extra.eas.projectId` is missing from the app config. Run `eas init` to link the project, so the events can be sent to EAS Observe.'
      );
    }
    return null;
  }
  const baseUrl = (eas.observe?.endpointUrl ?? defaultEndpointUrl).replace(/\/+$/, '');
  return `${baseUrl}/${eas.projectId}/v1/logs`;
}

function getResourceAttributes(): Record<string, string | undefined> {
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
    'expo.environment': config.environment ?? bundleDefaults?.environment,
  };
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
