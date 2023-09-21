var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  CommonActions: true,
  BaseRouter: true,
  DrawerActions: true,
  DrawerRouter: true,
  StackActions: true,
  StackRouter: true,
  TabActions: true,
  TabRouter: true
};
Object.defineProperty(exports, "BaseRouter", {
  enumerable: true,
  get: function get() {
    return _BaseRouter.default;
  }
});
exports.CommonActions = void 0;
Object.defineProperty(exports, "DrawerActions", {
  enumerable: true,
  get: function get() {
    return _DrawerRouter.DrawerActions;
  }
});
Object.defineProperty(exports, "DrawerRouter", {
  enumerable: true,
  get: function get() {
    return _DrawerRouter.default;
  }
});
Object.defineProperty(exports, "StackActions", {
  enumerable: true,
  get: function get() {
    return _StackRouter.StackActions;
  }
});
Object.defineProperty(exports, "StackRouter", {
  enumerable: true,
  get: function get() {
    return _StackRouter.default;
  }
});
Object.defineProperty(exports, "TabActions", {
  enumerable: true,
  get: function get() {
    return _TabRouter.TabActions;
  }
});
Object.defineProperty(exports, "TabRouter", {
  enumerable: true,
  get: function get() {
    return _TabRouter.default;
  }
});
var CommonActions = _interopRequireWildcard(require("./CommonActions"));
exports.CommonActions = CommonActions;
var _BaseRouter = _interopRequireDefault(require("./BaseRouter"));
var _DrawerRouter = _interopRequireWildcard(require("./DrawerRouter"));
var _StackRouter = _interopRequireWildcard(require("./StackRouter"));
var _TabRouter = _interopRequireWildcard(require("./TabRouter"));
var _types = require("./types");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _types[key];
    }
  });
});
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }