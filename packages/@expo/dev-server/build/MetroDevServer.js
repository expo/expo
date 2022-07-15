"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDevServerMiddleware = exports.LogReporter = exports.attachInspectorProxy = exports.bundleAsync = exports.runMetroDevServerAsync = void 0;
const config_1 = require("@expo/config");
const chalk_1 = __importDefault(require("chalk"));
const HermesBundler_1 = require("./HermesBundler");
const LogReporter_1 = __importDefault(require("./LogReporter"));
exports.LogReporter = LogReporter_1.default;
const importMetroFromProject_1 = require("./metro/importMetroFromProject");
const devServerMiddleware_1 = require("./middleware/devServerMiddleware");
Object.defineProperty(exports, "createDevServerMiddleware", { enumerable: true, get: function () { return devServerMiddleware_1.createDevServerMiddleware; } });
function getExpoMetroConfig(projectRoot, { logger, unversioned }) {
    if (!unversioned) {
        try {
            return (0, importMetroFromProject_1.importExpoMetroConfigFromProject)(projectRoot);
        }
        catch {
            // If expo isn't installed, use the unversioned config and warn about installing expo.
        }
    }
    const unversionedVersion = require('@expo/metro-config/package.json').version;
    logger.info({ tag: 'expo' }, chalk_1.default.gray(`\u203A Unversioned ${chalk_1.default.bold `@expo/metro-config@${unversionedVersion}`} is being used. Bundling apps may not work as expected, and is subject to breaking changes. Install ${chalk_1.default.bold `expo`} or set the app.json sdkVersion to use a stable version of @expo/metro-config.`));
    return require('@expo/metro-config');
}
async function runMetroDevServerAsync(projectRoot, options) {
    const Metro = (0, importMetroFromProject_1.importMetroFromProject)(projectRoot);
    const reporter = new LogReporter_1.default(options.logger);
    const ExpoMetroConfig = getExpoMetroConfig(projectRoot, options);
    const metroConfig = await ExpoMetroConfig.loadAsync(projectRoot, { reporter, ...options });
    const { middleware, attachToServer, 
    // RN +68 -- Expo SDK +45
    messageSocketEndpoint, eventsSocketEndpoint, websocketEndpoints, } = (0, devServerMiddleware_1.createDevServerMiddleware)(projectRoot, {
        port: metroConfig.server.port,
        watchFolders: metroConfig.watchFolders,
        logger: options.logger,
    });
    const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
    // @ts-ignore can't mutate readonly config
    metroConfig.server.enhanceMiddleware = (metroMiddleware, server) => {
        if (customEnhanceMiddleware) {
            metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
        }
        return middleware.use(metroMiddleware);
    };
    const server = await Metro.runServer(metroConfig, {
        hmrEnabled: true,
        websocketEndpoints,
    });
    if (attachToServer) {
        // Expo SDK 44 and lower
        const { messageSocket, eventsSocket } = attachToServer(server);
        reporter.reportEvent = eventsSocket.reportEvent;
        return {
            server,
            middleware,
            messageSocket,
        };
    }
    else {
        // RN +68 -- Expo SDK +45
        reporter.reportEvent = eventsSocketEndpoint.reportEvent;
        return {
            server,
            middleware,
            messageSocket: messageSocketEndpoint,
            // debuggerProxyEndpoint,
        };
    }
}
exports.runMetroDevServerAsync = runMetroDevServerAsync;
let nextBuildID = 0;
// TODO: deprecate options.target
async function bundleAsync(projectRoot, expoConfig, options, bundles) {
    const metro = (0, importMetroFromProject_1.importMetroFromProject)(projectRoot);
    const Server = (0, importMetroFromProject_1.importMetroServerFromProject)(projectRoot);
    const reporter = new LogReporter_1.default(options.logger);
    const ExpoMetroConfig = getExpoMetroConfig(projectRoot, options);
    const config = await ExpoMetroConfig.loadAsync(projectRoot, { reporter, ...options });
    const buildID = `bundle_${nextBuildID++}`;
    const metroServer = await metro.runMetro(config, {
        watch: false,
    });
    const buildAsync = async (bundle) => {
        var _a, _b, _c, _d;
        const bundleOptions = {
            ...Server.DEFAULT_BUNDLE_OPTIONS,
            bundleType: 'bundle',
            platform: bundle.platform,
            entryFile: bundle.entryPoint,
            dev: (_a = bundle.dev) !== null && _a !== void 0 ? _a : false,
            minify: (_b = bundle.minify) !== null && _b !== void 0 ? _b : !bundle.dev,
            inlineSourceMap: false,
            sourceMapUrl: bundle.sourceMapUrl,
            createModuleIdFactory: config.serializer.createModuleIdFactory,
            onProgress: (transformedFileCount, totalFileCount) => {
                if (!options.quiet) {
                    reporter.update({
                        buildID,
                        type: 'bundle_transform_progressed',
                        transformedFileCount,
                        totalFileCount,
                    });
                }
            },
        };
        reporter.update({
            buildID,
            type: 'bundle_build_started',
            bundleDetails: {
                bundleType: bundleOptions.bundleType,
                platform: bundle.platform,
                entryFile: bundle.entryPoint,
                dev: (_c = bundle.dev) !== null && _c !== void 0 ? _c : false,
                minify: (_d = bundle.minify) !== null && _d !== void 0 ? _d : false,
            },
        });
        const { code, map } = await metroServer.build(bundleOptions);
        const assets = (await metroServer.getAssets(bundleOptions));
        reporter.update({
            buildID,
            type: 'bundle_build_done',
        });
        return { code, map, assets };
    };
    const maybeAddHermesBundleAsync = async (bundle, bundleOutput) => {
        var _a, _b;
        const { platform } = bundle;
        const isHermesManaged = (0, HermesBundler_1.isEnableHermesManaged)(expoConfig, platform);
        const paths = (0, config_1.getConfigFilePaths)(projectRoot);
        const configFilePath = (_b = (_a = paths.dynamicConfigPath) !== null && _a !== void 0 ? _a : paths.staticConfigPath) !== null && _b !== void 0 ? _b : 'app.json';
        await (0, HermesBundler_1.maybeThrowFromInconsistentEngineAsync)(projectRoot, configFilePath, platform, isHermesManaged);
        if (isHermesManaged) {
            const platformTag = chalk_1.default.bold({ ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform);
            options.logger.info({ tag: 'expo' }, `💿 ${platformTag} Building Hermes bytecode for the bundle`);
            const hermesBundleOutput = await (0, HermesBundler_1.buildHermesBundleAsync)(projectRoot, bundleOutput.code, bundleOutput.map, bundle.minify);
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
    }
    finally {
        metroServer.end();
    }
}
exports.bundleAsync = bundleAsync;
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
function attachInspectorProxy(projectRoot, { server, middleware }) {
    const { InspectorProxy } = (0, importMetroFromProject_1.importInspectorProxyServerFromProject)(projectRoot);
    const inspectorProxy = new InspectorProxy(projectRoot);
    if ('addWebSocketListener' in inspectorProxy) {
        // metro@0.59.0
        inspectorProxy.addWebSocketListener(server);
    }
    else if ('createWebSocketListeners' in inspectorProxy) {
        // metro@0.66.0
        // TODO: This isn't properly support without a ws router.
        inspectorProxy.createWebSocketListeners(server);
    }
    // TODO(hypuk): Refactor inspectorProxy.processRequest into separate request handlers
    // so that we could provide routes (/json/list and /json/version) here.
    // Currently this causes Metro to give warning about T31407894.
    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    middleware.use(inspectorProxy.processRequest.bind(inspectorProxy));
    return { inspectorProxy };
}
exports.attachInspectorProxy = attachInspectorProxy;
__exportStar(require("./middlwareMutations"), exports);
__exportStar(require("./JsInspector"), exports);
//# sourceMappingURL=MetroDevServer.js.map