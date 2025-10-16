/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on this but with web support:
 * https://github.com/facebook/react-native/blob/086714b02b0fb838dee5a66c5bcefe73b53cf3df/Libraries/Utilities/HMRClient.js
 */
import MetroHMRClient from '@expo/metro/metro-runtime/modules/HMRClient';
import prettyFormat, { plugins } from 'pretty-format';
import { DeviceEventEmitter } from 'react-native';

// Ensure events are sent so custom Fast Refresh views are shown.
function showLoading(message: string, _type: 'load' | 'refresh') {
  DeviceEventEmitter.emit('devLoadingView:showMessage', {
    message,
  });
}

function hideLoading() {
  DeviceEventEmitter.emit('devLoadingView:hide', {});
}

const pendingEntryPoints: string[] = [];

// @ts-expect-error: Account for multiple versions of pretty-format inside of a monorepo.
const prettyFormatFunc = typeof prettyFormat === 'function' ? prettyFormat : prettyFormat.default;

type HMRClientType = {
  send: (msg: string) => void;
  isEnabled: () => boolean;
  disable: () => void;
  enable: () => void;
  hasPendingUpdates: () => boolean;
};

let hmrClient: HMRClientType | null = null;
let hmrUnavailableReason: string | null = null;
let currentCompileErrorMessage: string | null = null;
let didConnect: boolean = false;
const pendingLogs: [LogLevel, any[]][] = [];

type LogLevel =
  | 'trace'
  | 'info'
  | 'warn'
  | 'error'
  | 'log'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'debug';

export type HMRClientNativeInterface = {
  enable(): void;
  disable(): void;
  registerBundle(requestUrl: string): void;
  log(level: LogLevel, data: any[]): void;
  setup(props: { isEnabled: boolean }): void;
};

function assert(foo: any, msg: string): asserts foo {
  if (!foo) throw new Error(msg);
}

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient: HMRClientNativeInterface = {
  enable() {
    if (hmrUnavailableReason !== null) {
      // If HMR became unavailable while you weren't using it,
      // explain why when you try to turn it on.
      // This is an error (and not a warning) because it is shown
      // in response to a direct user action.
      throw new Error(hmrUnavailableReason);
    }

    assert(hmrClient, 'Expected HMRClient.setup() call at startup.');

    // We use this for internal logging only.
    // It doesn't affect the logic.
    hmrClient.send(JSON.stringify({ type: 'log-opt-in' }));

    // When toggling Fast Refresh on, we might already have some stashed updates.
    // Since they'll get applied now, we'll show a banner.
    const hasUpdates = hmrClient!.hasPendingUpdates();

    if (hasUpdates) {
      showLoading('Refreshing...', 'refresh');
    }
    try {
      hmrClient.enable();
    } finally {
      if (hasUpdates) {
        hideLoading();
      }
    }

    // There could be a compile error while Fast Refresh was off,
    // but we ignored it at the time. Show it now.
    showCompileError();
  },

  disable() {
    assert(hmrClient, 'Expected HMRClient.setup() call at startup.');
    hmrClient.disable();
  },

  registerBundle(requestUrl: string) {
    assert(hmrClient, 'Expected HMRClient.setup() call at startup.');
    pendingEntryPoints.push(requestUrl);
    registerBundleEntryPoints(hmrClient);
  },

  log(level: LogLevel, data: any[]) {
    if (!hmrClient) {
      // Catch a reasonable number of early logs
      // in case hmrClient gets initialized later.
      pendingLogs.push([level, data]);
      if (pendingLogs.length > 100) {
        pendingLogs.shift();
      }
      return;
    }
    try {
      hmrClient.send(
        JSON.stringify({
          type: 'log',
          level,
          platform: 'web',
          mode: 'BRIDGE',
          data: data.map((item) =>
            typeof item === 'string'
              ? item
              : prettyFormatFunc(item, {
                  escapeString: true,
                  highlight: true,
                  maxDepth: 3,
                  min: true,
                  plugins: [plugins.ReactElement],
                })
          ),
        })
      );
    } catch {
      // If sending logs causes any failures we want to silently ignore them
      // to ensure we do not cause infinite-logging loops.
    }
  },

  // Called once by the bridge on startup, even if Fast Refresh is off.
  // It creates the HMR client but doesn't actually set up the socket yet.
  setup({ isEnabled }: { isEnabled: boolean }) {
    assert(!hmrClient, 'Cannot initialize hmrClient twice');

    const serverScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const client = new MetroHMRClient(`${serverScheme}://${window.location.host}/hot`);
    hmrClient = client;

    const fullBundleUrl = (() => {
      const currentScript = document?.currentScript;
      const bundleUrl = new URL(
        currentScript && 'src' in currentScript ? currentScript.src : location.href,
        location.href
      );

      if (!bundleUrl.searchParams.has('platform')) {
        bundleUrl.searchParams.set('platform', process.env.EXPO_OS ?? 'web');
      }

      return bundleUrl.toString();
    })();

    pendingEntryPoints.push(
      // HMRServer understands regular bundle URLs, so prefer that in case
      // there are any important URL parameters we can't reconstruct from
      // `setup()`'s arguments.
      fullBundleUrl
    );

    client.on('connection-error', (e: Error) => {
      let error = `Cannot connect to Metro.
 
 Try the following to fix the issue:
 - Ensure the Metro dev server is running and available on the same network as this device`;
      error += `
 
 URL: ${window.location.host}
 
 Error: ${e.message}`;

      setHMRUnavailableReason(error);
    });

    client.on('update-start', ({ isInitialUpdate }: { isInitialUpdate?: boolean }) => {
      currentCompileErrorMessage = null;
      didConnect = true;

      if (client.isEnabled() && !isInitialUpdate) {
        showLoading('Refreshing...', 'refresh');
      }
    });

    client.on('update', ({ isInitialUpdate }: { isInitialUpdate?: boolean }) => {
      if (client.isEnabled() && !isInitialUpdate) {
        dismissRedbox();
        // @ts-expect-error
        globalThis.__expo_dev_resetErrors?.();
        // LogBox.clearAllLogs();
      }
    });

    client.on('update-done', () => {
      hideLoading();
    });

    client.on('error', (data: { type: string; message: string }) => {
      hideLoading();

      if (data.type === 'GraphNotFoundError') {
        client.close();
        setHMRUnavailableReason('Metro has restarted since the last edit. Reload to reconnect.');
      } else if (data.type === 'RevisionNotFoundError') {
        client.close();
        setHMRUnavailableReason('Metro and the client are out of sync. Reload to reconnect.');
      } else {
        currentCompileErrorMessage = `${data.type} ${data.message}`;
        if (client.isEnabled()) {
          showCompileError();
        }
      }
    });

    client.on('close', (closeEvent: { code: number; reason: string }) => {
      hideLoading();

      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5
      const isNormalOrUnsetCloseReason =
        closeEvent == null ||
        closeEvent.code === 1000 ||
        closeEvent.code === 1005 ||
        closeEvent.code == null;

      setHMRUnavailableReason(
        `${
          isNormalOrUnsetCloseReason
            ? 'Disconnected from Metro.'
            : `Disconnected from Metro (${closeEvent.code}: "${closeEvent.reason}").`
        }

To reconnect:
- Ensure that Metro is running and available on the same network
- Reload this app (will trigger further help if Metro cannot be connected to)
      `
      );
    });

    if (isEnabled) {
      HMRClient.enable();
    } else {
      HMRClient.disable();
    }

    registerBundleEntryPoints(hmrClient);
    flushEarlyLogs();
  },
};

function setHMRUnavailableReason(reason: string) {
  assert(hmrClient, 'Expected HMRClient.setup() call at startup.');
  if (hmrUnavailableReason !== null) {
    // Don't show more than one warning.
    return;
  }
  hmrUnavailableReason = reason;

  // We only want to show a warning if Fast Refresh is on *and* if we ever
  // previously managed to connect successfully. We don't want to show
  // the warning to native engineers who use cached bundles without Metro.
  if (hmrClient.isEnabled() && didConnect) {
    console.warn(reason);
    // (Not using the `warning` module to prevent a Buck cycle.)
  }
}

function registerBundleEntryPoints(client: HMRClientType | null) {
  if (hmrUnavailableReason != null) {
    // "Bundle Splitting – Metro disconnected"
    window.location.reload();
    return;
  }

  if (pendingEntryPoints.length > 0) {
    client?.send(
      JSON.stringify({
        type: 'register-entrypoints',
        entryPoints: pendingEntryPoints,
      })
    );
    pendingEntryPoints.length = 0;
  }
}

function flushEarlyLogs() {
  try {
    pendingLogs.forEach(([level, data]) => {
      HMRClient.log(level, data);
    });
  } finally {
    pendingLogs.length = 0;
  }
}

function dismissRedbox() {
  // TODO(EvanBacon): Error overlay for web.
}

function showCompileError() {
  if (currentCompileErrorMessage === null) {
    return;
  }

  // Even if there is already a redbox, syntax errors are more important.
  // Otherwise you risk seeing a stale runtime error while a syntax error is more recent.
  dismissRedbox();

  const message = currentCompileErrorMessage;
  currentCompileErrorMessage = null;

  const error = new Error(message);
  // Symbolicating compile errors is wasted effort
  // because the stack trace is meaningless:
  // @ts-expect-error
  error.preventSymbolication = true;
  throw error;
}

export default HMRClient;
