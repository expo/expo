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
import MetroHMRClient from 'metro-runtime/src/modules/HMRClient';
import prettyFormat, { plugins } from 'pretty-format';

import LoadingView from './LoadingView';
import LogBox from './error-overlay/LogBox';
import {
  MetroBuildError,
  MetroPackageResolutionError,
  MetroTransformError,
} from './error-overlay/metro-build-errors';
import getDevServer from './getDevServer';

const pendingEntryPoints: string[] = [];

// @ts-expect-error: Account for multiple versions of pretty-format inside of a monorepo.
const prettyFormatFunc = typeof prettyFormat === 'function' ? prettyFormat : prettyFormat.default;

let hmrClient: MetroHMRClient | null = null;
let hmrUnavailableReason: string | null = null;
const buildErrorQueue = new Set<MetroBuildError>();
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

function assert(foo: any, msg: string): asserts foo {
  if (!foo) throw new Error(msg);
}

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient = {
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
      LoadingView.showMessage('Refreshing...', 'refresh');
    }
    try {
      hmrClient.enable();
    } finally {
      if (hasUpdates) {
        LoadingView.hide();
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

    const { fullBundleUrl } = getDevServer();
    pendingEntryPoints.push(
      // HMRServer understands regular bundle URLs, so prefer that in case
      // there are any important URL parameters we can't reconstruct from
      // `setup()`'s arguments.
      fullBundleUrl
    );

    client.on('connection-error', (e: Error) => {
      let error = `Cannot connect to Expo CLI.
 
 Try the following to fix the issue:
 - Ensure the Expo dev server is running and available on the same network as this device`;
      error += `
 
 URL: ${window.location.host}
 
 Error: ${e.message}`;

      setHMRUnavailableReason(error);
    });

    client.on('update-start', ({ isInitialUpdate }: { isInitialUpdate?: boolean }) => {
      buildErrorQueue.clear();
      didConnect = true;

      if (client.isEnabled() && !isInitialUpdate) {
        LoadingView.showMessage('Refreshing...', 'refresh');
      }
    });

    client.on('update', ({ isInitialUpdate }: { isInitialUpdate?: boolean }) => {
      if (client.isEnabled() && !isInitialUpdate) {
        LogBox.clearAllLogs();
        // dismissGlobalErrorOverlay();
      }
    });

    client.on('update-done', () => {
      LoadingView.hide();
    });

    client.on('error', (data) => this._onMetroError(data));

    client.on('close', (closeEvent: { code: number; reason: string }) => {
      LoadingView.hide();

      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5
      const isNormalOrUnsetCloseReason =
        closeEvent == null ||
        closeEvent.code === 1000 ||
        closeEvent.code === 1005 ||
        closeEvent.code === 1006 ||
        closeEvent.code == null;

      setHMRUnavailableReason(
        `${
          isNormalOrUnsetCloseReason
            ? 'Disconnected from Expo CLI.'
            : `Disconnected from Expo CLI (${closeEvent.code}: "${closeEvent.reason}").`
        }

To reconnect:
- Start the dev server with: npx expo
- Reload the ${process.env.EXPO_OS === 'web' ? 'page' : 'app'}`
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

  _onMetroError(data: unknown) {
    // console.log('FIXTURE', data);

    if (!hmrClient) {
      return;
    }

    assert(typeof data === 'object' && data != null, 'Expected data to be an object');

    LoadingView.hide();

    if ('type' in data) {
      if (data.type === 'GraphNotFoundError') {
        hmrClient.close();
        setHMRUnavailableReason('Expo CLI has restarted since the last edit. Reload to reconnect.');
        return;
      } else if (data.type === 'RevisionNotFoundError') {
        hmrClient.close();
        setHMRUnavailableReason(
          `Expo CLI and the ${process.env.EXPO_OS} client are out of sync. Reload to reconnect.`
        );
        return;
      }
    }

    const message = [
      // @ts-expect-error
      data.type,
      // @ts-expect-error
      data.message,
    ]
      .filter(Boolean)
      .join(' ');

    const type: string | undefined = (data as any).type;
    const errors: any[] | undefined = (data as any).errors;

    // Fallback for resolution errors which don't return a type
    // https://github.com/facebook/metro/blob/a3fac645dc377f78bd4182ca0ca73629b2707d5b/packages/metro/src/lib/formatBundlingError.js#L65-L73
    // https://github.com/facebook/metro/pull/1487
    let error: MetroBuildError;
    if (
      'originModulePath' in data &&
      typeof data.originModulePath === 'string' &&
      'targetModuleName' in data &&
      typeof data.targetModuleName === 'string' &&
      'cause' in data
    ) {
      error = new MetroPackageResolutionError(
        message,
        type,
        errors,
        data.originModulePath,
        data.targetModuleName,
        // @ts-expect-error
        data.cause
      );
    } else if (type === 'TransformError') {
      assert(
        'lineNumber' in data,
        '[Internal] Expected lineNumber to be in Metro HMR error update'
      );
      assert('column' in data, '[Internal] Expected column to be in Metro HMR error update');
      assert('filename' in data, '[Internal] Expected filename to be in Metro HMR error update');

      error = new MetroTransformError(
        message,
        type,
        errors!,
        data.lineNumber,
        data.column,
        data.filename
      );
    } else {
      error = new MetroBuildError(message, type, errors);
    }

    // TODO: Add import stack to the error: EXPO_METRO_UNSTABLE_ERRORS=1
    // if ('stack' in data && typeof data.stack === 'string') {
    //   error.stack = stripAnsi(data.stack);
    // }

    buildErrorQueue.add(error);

    if (hmrClient.isEnabled()) {
      showCompileError();
    }
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

function registerBundleEntryPoints(client: MetroHMRClient | null) {
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

function showCompileError() {
  if (buildErrorQueue.size === 0) {
    return;
  }

  // Even if there is already a redbox, syntax errors are more important.
  // Otherwise you risk seeing a stale runtime error while a syntax error is more recent.
  // dismissGlobalErrorOverlay();

  const error = buildErrorQueue.values().next().value;
  buildErrorQueue.clear();
  throw error;
}

export default HMRClient;
