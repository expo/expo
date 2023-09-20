var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _BatchedBridge = _interopRequireDefault(require("../BatchedBridge/BatchedBridge"));
var _BugReporting = _interopRequireDefault(require("../BugReporting/BugReporting"));
var _createPerformanceLogger = _interopRequireDefault(require("../Utilities/createPerformanceLogger"));
var _infoLog = _interopRequireDefault(require("../Utilities/infoLog"));
var _SceneTracker = _interopRequireDefault(require("../Utilities/SceneTracker"));
var _DisplayMode = require("./DisplayMode");
var _HeadlessJsTaskError = _interopRequireDefault(require("./HeadlessJsTaskError"));
var _NativeHeadlessJsTaskSupport = _interopRequireDefault(require("./NativeHeadlessJsTaskSupport"));
var _renderApplication = _interopRequireDefault(require("./renderApplication"));
var _RendererProxy = require("./RendererProxy");
var _invariant = _interopRequireDefault(require("invariant"));
var runnables = {};
var runCount = 1;
var sections = {};
var taskProviders = new Map();
var taskCancelProviders = new Map();
var componentProviderInstrumentationHook = function componentProviderInstrumentationHook(component) {
  return component();
};
var wrapperComponentProvider;
var showArchitectureIndicator = false;
var AppRegistry = {
  setWrapperComponentProvider: function setWrapperComponentProvider(provider) {
    wrapperComponentProvider = provider;
  },
  enableArchitectureIndicator: function enableArchitectureIndicator(enabled) {
    showArchitectureIndicator = enabled;
  },
  registerConfig: function registerConfig(config) {
    config.forEach(function (appConfig) {
      if (appConfig.run) {
        AppRegistry.registerRunnable(appConfig.appKey, appConfig.run);
      } else {
        (0, _invariant.default)(appConfig.component != null, 'AppRegistry.registerConfig(...): Every config is expected to set ' + 'either `run` or `component`, but `%s` has neither.', appConfig.appKey);
        AppRegistry.registerComponent(appConfig.appKey, appConfig.component, appConfig.section);
      }
    });
  },
  registerComponent: function registerComponent(appKey, componentProvider, section) {
    var scopedPerformanceLogger = (0, _createPerformanceLogger.default)();
    runnables[appKey] = {
      componentProvider: componentProvider,
      run: function run(appParameters, displayMode) {
        var _appParameters$initia;
        var concurrentRootEnabled = ((_appParameters$initia = appParameters.initialProps) == null ? void 0 : _appParameters$initia.concurrentRoot) || appParameters.concurrentRoot;
        (0, _renderApplication.default)(componentProviderInstrumentationHook(componentProvider, scopedPerformanceLogger), appParameters.initialProps, appParameters.rootTag, wrapperComponentProvider && wrapperComponentProvider(appParameters), appParameters.fabric, showArchitectureIndicator, scopedPerformanceLogger, appKey === 'LogBox', appKey, (0, _DisplayMode.coerceDisplayMode)(displayMode), concurrentRootEnabled);
      }
    };
    if (section) {
      sections[appKey] = runnables[appKey];
    }
    return appKey;
  },
  registerRunnable: function registerRunnable(appKey, run) {
    runnables[appKey] = {
      run: run
    };
    return appKey;
  },
  registerSection: function registerSection(appKey, component) {
    AppRegistry.registerComponent(appKey, component, true);
  },
  getAppKeys: function getAppKeys() {
    return Object.keys(runnables);
  },
  getSectionKeys: function getSectionKeys() {
    return Object.keys(sections);
  },
  getSections: function getSections() {
    return Object.assign({}, sections);
  },
  getRunnable: function getRunnable(appKey) {
    return runnables[appKey];
  },
  getRegistry: function getRegistry() {
    return {
      sections: AppRegistry.getSectionKeys(),
      runnables: Object.assign({}, runnables)
    };
  },
  setComponentProviderInstrumentationHook: function setComponentProviderInstrumentationHook(hook) {
    componentProviderInstrumentationHook = hook;
  },
  runApplication: function runApplication(appKey, appParameters, displayMode) {
    if (appKey !== 'LogBox') {
      var logParams = __DEV__ ? '" with ' + JSON.stringify(appParameters) : '';
      var msg = 'Running "' + appKey + logParams;
      (0, _infoLog.default)(msg);
      _BugReporting.default.addSource('AppRegistry.runApplication' + runCount++, function () {
        return msg;
      });
    }
    (0, _invariant.default)(runnables[appKey] && runnables[appKey].run, `"${appKey}" has not been registered. This can happen if:\n` + '* Metro (the local dev server) is run from the wrong folder. ' + 'Check if Metro is running, stop it and restart it in the current project.\n' + "* A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.");
    _SceneTracker.default.setActiveScene({
      name: appKey
    });
    runnables[appKey].run(appParameters, displayMode);
  },
  setSurfaceProps: function setSurfaceProps(appKey, appParameters, displayMode) {
    if (appKey !== 'LogBox') {
      var msg = 'Updating props for Surface "' + appKey + '" with ' + JSON.stringify(appParameters);
      (0, _infoLog.default)(msg);
      _BugReporting.default.addSource('AppRegistry.setSurfaceProps' + runCount++, function () {
        return msg;
      });
    }
    (0, _invariant.default)(runnables[appKey] && runnables[appKey].run, `"${appKey}" has not been registered. This can happen if:\n` + '* Metro (the local dev server) is run from the wrong folder. ' + 'Check if Metro is running, stop it and restart it in the current project.\n' + "* A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.");
    runnables[appKey].run(appParameters, displayMode);
  },
  unmountApplicationComponentAtRootTag: function unmountApplicationComponentAtRootTag(rootTag) {
    (0, _RendererProxy.unmountComponentAtNodeAndRemoveContainer)(rootTag);
  },
  registerHeadlessTask: function registerHeadlessTask(taskKey, taskProvider) {
    this.registerCancellableHeadlessTask(taskKey, taskProvider, function () {
      return function () {};
    });
  },
  registerCancellableHeadlessTask: function registerCancellableHeadlessTask(taskKey, taskProvider, taskCancelProvider) {
    if (taskProviders.has(taskKey)) {
      console.warn(`registerHeadlessTask or registerCancellableHeadlessTask called multiple times for same key '${taskKey}'`);
    }
    taskProviders.set(taskKey, taskProvider);
    taskCancelProviders.set(taskKey, taskCancelProvider);
  },
  startHeadlessTask: function startHeadlessTask(taskId, taskKey, data) {
    var taskProvider = taskProviders.get(taskKey);
    if (!taskProvider) {
      console.warn(`No task registered for key ${taskKey}`);
      if (_NativeHeadlessJsTaskSupport.default) {
        _NativeHeadlessJsTaskSupport.default.notifyTaskFinished(taskId);
      }
      return;
    }
    taskProvider()(data).then(function () {
      if (_NativeHeadlessJsTaskSupport.default) {
        _NativeHeadlessJsTaskSupport.default.notifyTaskFinished(taskId);
      }
    }).catch(function (reason) {
      console.error(reason);
      if (_NativeHeadlessJsTaskSupport.default && reason instanceof _HeadlessJsTaskError.default) {
        _NativeHeadlessJsTaskSupport.default.notifyTaskRetry(taskId).then(function (retryPosted) {
          if (!retryPosted) {
            _NativeHeadlessJsTaskSupport.default.notifyTaskFinished(taskId);
          }
        });
      }
    });
  },
  cancelHeadlessTask: function cancelHeadlessTask(taskId, taskKey) {
    var taskCancelProvider = taskCancelProviders.get(taskKey);
    if (!taskCancelProvider) {
      throw new Error(`No task canceller registered for key '${taskKey}'`);
    }
    taskCancelProvider()();
  }
};
if (!(global.RN$Bridgeless === true)) {
  _BatchedBridge.default.registerCallableModule('AppRegistry', AppRegistry);
  AppRegistry.registerComponent('LogBox', function () {
    if (__DEV__) {
      return require("../LogBox/LogBoxInspectorContainer").default;
    } else {
      return function NoOp() {
        return null;
      };
    }
  });
}
module.exports = AppRegistry;
//# sourceMappingURL=AppRegistry.js.map