"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  runMetroDevServerAsync: true,
  bundleAsync: true,
  attachInspectorProxy: true,
  LogReporter: true,
  createDevServerMiddleware: true
};
Object.defineProperty(exports, "LogReporter", {
  enumerable: true,
  get: function () {
    return _LogReporter().default;
  }
});
exports.attachInspectorProxy = attachInspectorProxy;
exports.bundleAsync = bundleAsync;
Object.defineProperty(exports, "createDevServerMiddleware", {
  enumerable: true,
  get: function () {
    return _devServerMiddleware().createDevServerMiddleware;
  }
});
exports.runMetroDevServerAsync = runMetroDevServerAsync;

function _config() {
  const data = require("@expo/config");

  _config = function () {
    return data;
  };

  return data;
}

function _chalk() {
  const data = _interopRequireDefault(require("chalk"));

  _chalk = function () {
    return data;
  };

  return data;
}

function _HermesBundler() {
  const data = require("./HermesBundler");

  _HermesBundler = function () {
    return data;
  };

  return data;
}

function _LogReporter() {
  const data = _interopRequireDefault(require("./LogReporter"));

  _LogReporter = function () {
    return data;
  };

  return data;
}

function _importMetroFromProject() {
  const data = require("./metro/importMetroFromProject");

  _importMetroFromProject = function () {
    return data;
  };

  return data;
}

function _devServerMiddleware() {
  const data = require("./middleware/devServerMiddleware");

  _devServerMiddleware = function () {
    return data;
  };

  return data;
}

var _middlwareMutations = require("./middlwareMutations");

Object.keys(_middlwareMutations).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _middlwareMutations[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _middlwareMutations[key];
    }
  });
});

var _JsInspector = require("./JsInspector");

Object.keys(_JsInspector).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _JsInspector[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _JsInspector[key];
    }
  });
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getExpoMetroConfig(projectRoot, {
  logger,
  unversioned
}) {
  if (!unversioned) {
    try {
      return (0, _importMetroFromProject().importExpoMetroConfigFromProject)(projectRoot);
    } catch {// If expo isn't installed, use the unversioned config and warn about installing expo.
    }
  }

  const unversionedVersion = require('@expo/metro-config/package.json').version;

  logger.info({
    tag: 'expo'
  }, _chalk().default.gray(`\u203A Unversioned ${_chalk().default.bold`@expo/metro-config@${unversionedVersion}`} is being used. Bundling apps may not work as expected, and is subject to breaking changes. Install ${_chalk().default.bold`expo`} or set the app.json sdkVersion to use a stable version of @expo/metro-config.`));
  return require('@expo/metro-config');
}

async function runMetroDevServerAsync(projectRoot, options) {
  const Metro = (0, _importMetroFromProject().importMetroFromProject)(projectRoot);
  const reporter = new (_LogReporter().default)(options.logger);
  const ExpoMetroConfig = getExpoMetroConfig(projectRoot, options);
  const metroConfig = await ExpoMetroConfig.loadAsync(projectRoot, {
    reporter,
    ...options
  });
  const {
    middleware,
    attachToServer,
    // RN +68 -- Expo SDK +45
    messageSocketEndpoint,
    eventsSocketEndpoint,
    websocketEndpoints
  } = (0, _devServerMiddleware().createDevServerMiddleware)(projectRoot, {
    port: metroConfig.server.port,
    watchFolders: metroConfig.watchFolders,
    logger: options.logger
  });
  const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware; // @ts-ignore can't mutate readonly config

  metroConfig.server.enhanceMiddleware = (metroMiddleware, server) => {
    if (customEnhanceMiddleware) {
      metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
    }

    return middleware.use(metroMiddleware);
  };

  const server = await Metro.runServer(metroConfig, {
    hmrEnabled: true,
    websocketEndpoints
  });

  if (attachToServer) {
    // Expo SDK 44 and lower
    const {
      messageSocket,
      eventsSocket
    } = attachToServer(server);
    reporter.reportEvent = eventsSocket.reportEvent;
    return {
      server,
      middleware,
      messageSocket
    };
  } else {
    // RN +68 -- Expo SDK +45
    reporter.reportEvent = eventsSocketEndpoint.reportEvent;
    return {
      server,
      middleware,
      messageSocket: messageSocketEndpoint // debuggerProxyEndpoint,

    };
  }
}

let nextBuildID = 0; // TODO: deprecate options.target

async function bundleAsync(projectRoot, expoConfig, options, bundles) {
  const metro = (0, _importMetroFromProject().importMetroFromProject)(projectRoot);
  const Server = (0, _importMetroFromProject().importMetroServerFromProject)(projectRoot);
  const reporter = new (_LogReporter().default)(options.logger);
  const ExpoMetroConfig = getExpoMetroConfig(projectRoot, options);
  const config = await ExpoMetroConfig.loadAsync(projectRoot, {
    reporter,
    ...options
  });
  const buildID = `bundle_${nextBuildID++}`;
  const metroServer = await metro.runMetro(config, {
    watch: false
  });

  const buildAsync = async bundle => {
    var _bundle$dev, _bundle$minify, _bundle$dev2, _bundle$minify2;

    const bundleOptions = { ...Server.DEFAULT_BUNDLE_OPTIONS,
      bundleType: 'bundle',
      platform: bundle.platform,
      entryFile: bundle.entryPoint,
      dev: (_bundle$dev = bundle.dev) !== null && _bundle$dev !== void 0 ? _bundle$dev : false,
      minify: (_bundle$minify = bundle.minify) !== null && _bundle$minify !== void 0 ? _bundle$minify : !bundle.dev,
      inlineSourceMap: false,
      sourceMapUrl: bundle.sourceMapUrl,
      createModuleIdFactory: config.serializer.createModuleIdFactory,
      onProgress: (transformedFileCount, totalFileCount) => {
        if (!options.quiet) {
          reporter.update({
            buildID,
            type: 'bundle_transform_progressed',
            transformedFileCount,
            totalFileCount
          });
        }
      }
    };
    reporter.update({
      buildID,
      type: 'bundle_build_started',
      bundleDetails: {
        bundleType: bundleOptions.bundleType,
        platform: bundle.platform,
        entryFile: bundle.entryPoint,
        dev: (_bundle$dev2 = bundle.dev) !== null && _bundle$dev2 !== void 0 ? _bundle$dev2 : false,
        minify: (_bundle$minify2 = bundle.minify) !== null && _bundle$minify2 !== void 0 ? _bundle$minify2 : false
      }
    });
    const {
      code,
      map
    } = await metroServer.build(bundleOptions);
    const assets = await metroServer.getAssets(bundleOptions);
    reporter.update({
      buildID,
      type: 'bundle_build_done'
    });
    return {
      code,
      map,
      assets
    };
  };

  const maybeAddHermesBundleAsync = async (bundle, bundleOutput) => {
    var _ref, _paths$dynamicConfigP;

    const {
      platform
    } = bundle;
    const isHermesManaged = (0, _HermesBundler().isEnableHermesManaged)(expoConfig, platform);
    const paths = (0, _config().getConfigFilePaths)(projectRoot);
    const configFilePath = (_ref = (_paths$dynamicConfigP = paths.dynamicConfigPath) !== null && _paths$dynamicConfigP !== void 0 ? _paths$dynamicConfigP : paths.staticConfigPath) !== null && _ref !== void 0 ? _ref : 'app.json';
    await (0, _HermesBundler().maybeThrowFromInconsistentEngineAsync)(projectRoot, configFilePath, platform, isHermesManaged);

    if (isHermesManaged) {
      const platformTag = _chalk().default.bold({
        ios: 'iOS',
        android: 'Android',
        web: 'Web'
      }[platform] || platform);

      options.logger.info({
        tag: 'expo'
      }, `💿 ${platformTag} Building Hermes bytecode for the bundle`);
      const hermesBundleOutput = await (0, _HermesBundler().buildHermesBundleAsync)(projectRoot, bundleOutput.code, bundleOutput.map, bundle.minify);
      bundleOutput.hermesBytecodeBundle = hermesBundleOutput.hbc;
      bundleOutput.hermesSourcemap = hermesBundleOutput.sourcemap;
    }

    return bundleOutput;
  };

  try {
    const intermediateOutputs = await Promise.all(bundles.map(bundle => buildAsync(bundle)));
    const bundleOutputs = [];

    for (let i = 0; i < bundles.length; ++i) {
      // hermesc does not support parallel building even we spawn processes.
      // we should build them sequentially.
      bundleOutputs.push(await maybeAddHermesBundleAsync(bundles[i], intermediateOutputs[i]));
    }

    return bundleOutputs;
  } finally {
    metroServer.end();
  }
}
/**
 * Attach the inspector proxy to a development server.
 * Inspector proxy is used for viewing the JS context in a browser.
 * This must be attached after the server is listening.
 * Attaching consists of pushing custom middleware and appending WebSockets to the server.
 *
 *
 * @param projectRoot
 * @param props.server dev server to add WebSockets to
 * @param props.middleware dev server middleware to add extra middleware to
 */


function attachInspectorProxy(projectRoot, {
  server,
  middleware
}) {
  const {
    InspectorProxy
  } = (0, _importMetroFromProject().importInspectorProxyServerFromProject)(projectRoot);
  const inspectorProxy = new InspectorProxy(projectRoot);

  if ('addWebSocketListener' in inspectorProxy) {
    // metro@0.59.0
    inspectorProxy.addWebSocketListener(server);
  } else if ('createWebSocketListeners' in inspectorProxy) {
    // metro@0.66.0
    // TODO: This isn't properly support without a ws router.
    inspectorProxy.createWebSocketListeners(server);
  } // TODO(hypuk): Refactor inspectorProxy.processRequest into separate request handlers
  // so that we could provide routes (/json/list and /json/version) here.
  // Currently this causes Metro to give warning about T31407894.
  // $FlowFixMe[method-unbinding] added when improving typing for this parameters


  middleware.use(inspectorProxy.processRequest.bind(inspectorProxy));
  return {
    inspectorProxy
  };
}
//# sourceMappingURL=MetroDevServer.js.map