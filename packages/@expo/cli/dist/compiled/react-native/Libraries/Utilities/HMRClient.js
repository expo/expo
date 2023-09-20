var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _getDevServer2 = _interopRequireDefault(require("../Core/Devtools/getDevServer"));
var _LogBox = _interopRequireDefault(require("../LogBox/LogBox"));
var _NativeRedBox = _interopRequireDefault(require("../NativeModules/specs/NativeRedBox"));
var DevSettings = require('./DevSettings');
var Platform = require('./Platform');
var invariant = require('invariant');
var MetroHMRClient = require('metro-runtime/src/modules/HMRClient');
var prettyFormat = require('pretty-format');
var pendingEntryPoints = [];
var hmrClient = null;
var hmrUnavailableReason = null;
var currentCompileErrorMessage = null;
var didConnect = false;
var pendingLogs = [];
var HMRClient = {
  enable: function enable() {
    if (hmrUnavailableReason !== null) {
      throw new Error(hmrUnavailableReason);
    }
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    var LoadingView = require('./LoadingView');
    hmrClient.send(JSON.stringify({
      type: 'log-opt-in'
    }));
    var hasUpdates = hmrClient.hasPendingUpdates();
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
    showCompileError();
  },
  disable: function disable() {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    hmrClient.disable();
  },
  registerBundle: function registerBundle(requestUrl) {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    pendingEntryPoints.push(requestUrl);
    registerBundleEntryPoints(hmrClient);
  },
  log: function log(level, data) {
    if (!hmrClient) {
      pendingLogs.push([level, data]);
      if (pendingLogs.length > 100) {
        pendingLogs.shift();
      }
      return;
    }
    try {
      hmrClient.send(JSON.stringify({
        type: 'log',
        level: level,
        mode: global.RN$Bridgeless === true ? 'NOBRIDGE' : 'BRIDGE',
        data: data.map(function (item) {
          return typeof item === 'string' ? item : prettyFormat(item, {
            escapeString: true,
            highlight: true,
            maxDepth: 3,
            min: true,
            plugins: [prettyFormat.plugins.ReactElement]
          });
        })
      }));
    } catch (error) {}
  },
  setup: function setup(platform, bundleEntry, host, port, isEnabled) {
    var scheme = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'http';
    invariant(platform, 'Missing required parameter `platform`');
    invariant(bundleEntry, 'Missing required parameter `bundleEntry`');
    invariant(host, 'Missing required parameter `host`');
    invariant(!hmrClient, 'Cannot initialize hmrClient twice');
    var LoadingView = require('./LoadingView');
    var serverHost = port !== null && port !== '' ? `${host}:${port}` : host;
    var serverScheme = scheme;
    var client = new MetroHMRClient(`${serverScheme}://${serverHost}/hot`);
    hmrClient = client;
    var _getDevServer = (0, _getDevServer2.default)(),
      fullBundleUrl = _getDevServer.fullBundleUrl;
    pendingEntryPoints.push(fullBundleUrl != null ? fullBundleUrl : `${serverScheme}://${serverHost}/hot?bundleEntry=${bundleEntry}&platform=${platform}`);
    client.on('connection-error', function (e) {
      var error = `Cannot connect to Metro.

Try the following to fix the issue:
- Ensure that Metro is running and available on the same network`;
      if (Platform.OS === 'ios') {
        error += `
- Ensure that the Metro URL is correctly set in AppDelegate`;
      } else {
        error += `
- Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices
- If you're on a physical device connected to the same machine, run 'adb reverse tcp:8081 tcp:8081' to forward requests from your device
- If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:8081`;
      }
      error += `

URL: ${host}:${port}

Error: ${e.message}`;
      setHMRUnavailableReason(error);
    });
    client.on('update-start', function (_ref) {
      var isInitialUpdate = _ref.isInitialUpdate;
      currentCompileErrorMessage = null;
      didConnect = true;
      if (client.isEnabled() && !isInitialUpdate) {
        LoadingView.showMessage('Refreshing...', 'refresh');
      }
    });
    client.on('update', function (_ref2) {
      var isInitialUpdate = _ref2.isInitialUpdate;
      if (client.isEnabled() && !isInitialUpdate) {
        dismissRedbox();
        _LogBox.default.clearAllLogs();
      }
    });
    client.on('update-done', function () {
      LoadingView.hide();
    });
    client.on('error', function (data) {
      LoadingView.hide();
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
    client.on('close', function (closeEvent) {
      LoadingView.hide();
      var isNormalOrUnsetCloseReason = closeEvent == null || closeEvent.code === 1000 || closeEvent.code === 1005 || closeEvent.code == null;
      setHMRUnavailableReason(`${isNormalOrUnsetCloseReason ? 'Disconnected from Metro.' : `Disconnected from Metro (${closeEvent.code}: "${closeEvent.reason}").`}

To reconnect:
- Ensure that Metro is running and available on the same network
- Reload this app (will trigger further help if Metro cannot be connected to)
      `);
    });
    if (isEnabled) {
      HMRClient.enable();
    } else {
      HMRClient.disable();
    }
    registerBundleEntryPoints(hmrClient);
    flushEarlyLogs(hmrClient);
  }
};
function setHMRUnavailableReason(reason) {
  invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
  if (hmrUnavailableReason !== null) {
    return;
  }
  hmrUnavailableReason = reason;
  if (hmrClient.isEnabled() && didConnect) {
    console.warn(reason);
  }
}
function registerBundleEntryPoints(client) {
  if (hmrUnavailableReason != null) {
    DevSettings.reload('Bundle Splitting – Metro disconnected');
    return;
  }
  if (pendingEntryPoints.length > 0) {
    client.send(JSON.stringify({
      type: 'register-entrypoints',
      entryPoints: pendingEntryPoints
    }));
    pendingEntryPoints.length = 0;
  }
}
function flushEarlyLogs(client) {
  try {
    pendingLogs.forEach(function (_ref3) {
      var _ref4 = (0, _slicedToArray2.default)(_ref3, 2),
        level = _ref4[0],
        data = _ref4[1];
      HMRClient.log(level, data);
    });
  } finally {
    pendingLogs.length = 0;
  }
}
function dismissRedbox() {
  if (Platform.OS === 'ios' && _NativeRedBox.default != null && _NativeRedBox.default.dismiss != null) {
    _NativeRedBox.default.dismiss();
  } else {
    var NativeExceptionsManager = require('../Core/NativeExceptionsManager').default;
    NativeExceptionsManager && NativeExceptionsManager.dismissRedbox && NativeExceptionsManager.dismissRedbox();
  }
}
function showCompileError() {
  if (currentCompileErrorMessage === null) {
    return;
  }
  dismissRedbox();
  var message = currentCompileErrorMessage;
  currentCompileErrorMessage = null;
  var error = new Error(message);
  error.preventSymbolication = true;
  throw error;
}
module.exports = HMRClient;
//# sourceMappingURL=HMRClient.js.map