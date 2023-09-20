var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = renderApplication;
var _GlobalPerformanceLogger = _interopRequireDefault(require("../Utilities/GlobalPerformanceLogger"));
var _PerformanceLoggerContext = _interopRequireDefault(require("../Utilities/PerformanceLoggerContext"));
var _AppContainer = _interopRequireDefault(require("./AppContainer"));
var _DisplayMode = _interopRequireDefault(require("./DisplayMode"));
var _getCachedComponentWithDebugName = _interopRequireDefault(require("./getCachedComponentWithDebugName"));
var Renderer = _interopRequireWildcard(require("./RendererProxy"));
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
require("../Utilities/BackHandler");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function renderApplication(RootComponent, initialProps, rootTag, WrapperComponent, fabric, showArchitectureIndicator, scopedPerformanceLogger, isLogBox, debugName, displayMode, useConcurrentRoot, useOffscreen) {
  (0, _invariant.default)(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag);
  var performanceLogger = scopedPerformanceLogger != null ? scopedPerformanceLogger : _GlobalPerformanceLogger.default;
  var renderable = (0, _jsxRuntime.jsx)(_PerformanceLoggerContext.default.Provider, {
    value: performanceLogger,
    children: (0, _jsxRuntime.jsx)(_AppContainer.default, {
      rootTag: rootTag,
      fabric: fabric,
      showArchitectureIndicator: showArchitectureIndicator,
      WrapperComponent: WrapperComponent,
      initialProps: initialProps != null ? initialProps : Object.freeze({}),
      internal_excludeLogBox: isLogBox,
      children: (0, _jsxRuntime.jsx)(RootComponent, Object.assign({}, initialProps, {
        rootTag: rootTag
      }))
    })
  });
  if (__DEV__ && debugName) {
    var RootComponentWithMeaningfulName = (0, _getCachedComponentWithDebugName.default)(`${debugName}(RootComponent)`);
    renderable = (0, _jsxRuntime.jsx)(RootComponentWithMeaningfulName, {
      children: renderable
    });
  }
  if (useOffscreen && displayMode != null) {
    var Offscreen = React.unstable_Offscreen;
    renderable = (0, _jsxRuntime.jsx)(Offscreen, {
      mode: displayMode === _DisplayMode.default.VISIBLE ? 'visible' : 'hidden',
      children: renderable
    });
  }
  performanceLogger.startTimespan('renderApplication_React_render');
  performanceLogger.setExtra('usedReactConcurrentRoot', useConcurrentRoot ? '1' : '0');
  performanceLogger.setExtra('usedReactFabric', fabric ? '1' : '0');
  performanceLogger.setExtra('usedReactProfiler', Renderer.isProfilingRenderer());
  Renderer.renderElement({
    element: renderable,
    rootTag: rootTag,
    useFabric: Boolean(fabric),
    useConcurrentRoot: Boolean(useConcurrentRoot)
  });
  performanceLogger.stopTimespan('renderApplication_React_render');
}
//# sourceMappingURL=renderApplication.js.map