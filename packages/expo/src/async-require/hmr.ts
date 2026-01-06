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

import {
  getConnectionError,
  getFullBundlerUrl,
  handleCompileError,
  hideLoading,
  resetErrorOverlay,
  showLoading,
} from './hmrUtils';

const pendingEntryPoints: string[] = [];

// @ts-expect-error: Account for multiple versions of pretty-format inside of a monorepo.
const prettyFormatFunc = typeof prettyFormat === 'function' ? prettyFormat : prettyFormat.default;

let hmrClient: MetroHMRClient | null = null;
let hmrUnavailableReason: string | null = null;
const buildErrorQueue = new Set<unknown>();
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
      const webMetadata =
        process.env.EXPO_OS === 'web'
          ? {
              platform: 'web',
              mode: 'BRIDGE',
            }
          : undefined;
      hmrClient.send(
        JSON.stringify({
          // TODO: Type this properly.
          ...webMetadata,
          type: 'log',
          level,
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
  setup(
    platformOrOptions: string | { isEnabled: boolean },
    bundleEntry?: string,
    host?: string,
    port?: number | string,
    isEnabledOrUndefined?: boolean,
    scheme: string = 'http'
  ) {
    let isEnabled = !!isEnabledOrUndefined;
    let serverScheme: string;
    let serverHost: string;

    if (process.env.EXPO_OS === 'web') {
      assert(
        platformOrOptions && typeof platformOrOptions === 'object',
        'Expected platformOrOptions to be an options object on web.'
      );
      assert(!hmrClient, 'Cannot initialize hmrClient twice');
      isEnabled = platformOrOptions.isEnabled;

      serverScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      serverHost = window.location.host;
    } else {
      assert(
        platformOrOptions && typeof platformOrOptions === 'string',
        'Missing required parameter `platform`'
      );
      assert(bundleEntry, 'Missing required parameter `bundleEntry`');
      assert(host, 'Missing required parameter `host`');
      assert(!hmrClient, 'Cannot initialize hmrClient twice');

      serverHost = port !== null && port !== '' ? `${host}:${port}` : host;
      serverScheme = scheme;
    }

    const origin = `${serverScheme}://${serverHost}`;
    const client = new MetroHMRClient(`${origin}/hot`);
    hmrClient = client;

    pendingEntryPoints.push(
      // HMRServer understands regular bundle URLs, so prefer that in case
      // there are any important URL parameters we can't reconstruct from
      // `setup()`'s arguments.
      getFullBundlerUrl({
        serverScheme,
        serverHost,
        bundleEntry,
        platform: typeof platformOrOptions === 'string' ? platformOrOptions : undefined,
      })
    );

    client.on('connection-error', (e: Error) => {
      setHMRUnavailableReason(getConnectionError(serverHost, e));
    });

    client.on('update-start', ({ isInitialUpdate }: { isInitialUpdate?: boolean }) => {
      buildErrorQueue.clear();
      didConnect = true;

      if (client.isEnabled() && !isInitialUpdate) {
        showLoading('Refreshing...', 'refresh');
      }
    });

    client.on(
      'update',
      ({
        isInitialUpdate,
        added,
        modified,
        deleted,
      }: {
        isInitialUpdate?: boolean;
        added: unknown[];
        modified: unknown[];
        deleted: unknown[];
      }) => {
        // NOTE(@krystofwoldrich): I don't know why sometimes empty updates are sent. But they should not reset the overlay.
        const isEmpty = added.length === 0 && modified.length === 0 && deleted.length === 0;
        if (client.isEnabled() && !isInitialUpdate && !isEmpty) {
          resetErrorOverlay();
        }
      }
    );

    client.on('update-done', () => {
      hideLoading();
    });

    client.on('error', (data) => this._onMetroError(data));

    client.on('close', (closeEvent?: { code: number; reason: string }) => {
      hideLoading();
      const reason = closeEvent?.reason;
      const code = closeEvent?.code || 1000;
      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5
      const title =
        reason && code !== 1000 && code !== 1001 && code !== 1005
          ? `Disconnected from Metro (${code}: "${reason}")`
          : `Disconnected from Metro (${code})`;
      const message =
        title +
        '\nTo reconnect:' +
        '\n- Ensure that Metro is running and available on the same network' +
        '\n- Reload this app (will trigger further help if Metro cannot be connected to)';
      setHMRUnavailableReason(message);
    });

    if (isEnabled) {
      HMRClient.enable();
    } else {
      HMRClient.disable();
    }

    registerBundleEntryPoints(hmrClient);
    flushEarlyLogs();
  },

  // Related Metro error's formatting
  // https://github.com/facebook/metro/blob/34bb8913ec4b5b02690b39d2246599faf094f721/packages/metro/src/lib/formatBundlingError.js#L36
  _onMetroError(error: unknown) {
    if (!hmrClient) {
      return;
    }

    assert(typeof error === 'object' && error != null, 'Expected data to be an object');

    hideLoading();

    if ('type' in error) {
      if (error.type === 'GraphNotFoundError') {
        hmrClient.close();
        setHMRUnavailableReason('Expo CLI has restarted since the last edit. Reload to reconnect.');
        return;
      } else if (error.type === 'RevisionNotFoundError') {
        hmrClient.close();
        setHMRUnavailableReason(
          `Expo CLI and the ${process.env.EXPO_OS} client are out of sync. Reload to reconnect.`
        );
        return;
      }
    }

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
    // NOTE(@kitten): The timeout works around a Firefox quirk. In Chrome, the `close` event doesn't fire when the client reloads
    // However, in Firefox, the event fires as a page refreshes or navigates which is a case for which we don't want to show any message
    setTimeout(() => {
      console.warn(reason);
    }, 500);
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

  const cause: any = buildErrorQueue.values().next().value;
  buildErrorQueue.clear();
  handleCompileError(cause);
}

export default HMRClient;
