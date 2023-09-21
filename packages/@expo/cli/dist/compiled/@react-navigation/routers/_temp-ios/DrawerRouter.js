var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerActions = void 0;
exports.default = DrawerRouter;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _nonSecure = require("nanoid/non-secure");
var _TabRouter = _interopRequireWildcard(require("./TabRouter"));
var _excluded = ["defaultStatus"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var DrawerActions = Object.assign({}, _TabRouter.TabActions, {
  openDrawer: function openDrawer() {
    return {
      type: 'OPEN_DRAWER'
    };
  },
  closeDrawer: function closeDrawer() {
    return {
      type: 'CLOSE_DRAWER'
    };
  },
  toggleDrawer: function toggleDrawer() {
    return {
      type: 'TOGGLE_DRAWER'
    };
  }
});
exports.DrawerActions = DrawerActions;
function DrawerRouter(_ref) {
  var _ref$defaultStatus = _ref.defaultStatus,
    defaultStatus = _ref$defaultStatus === void 0 ? 'closed' : _ref$defaultStatus,
    rest = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var router = (0, _TabRouter.default)(rest);
  var isDrawerInHistory = function isDrawerInHistory(state) {
    var _state$history;
    return Boolean((_state$history = state.history) == null ? void 0 : _state$history.some(function (it) {
      return it.type === 'drawer';
    }));
  };
  var addDrawerToHistory = function addDrawerToHistory(state) {
    if (isDrawerInHistory(state)) {
      return state;
    }
    return Object.assign({}, state, {
      history: [].concat((0, _toConsumableArray2.default)(state.history), [{
        type: 'drawer',
        status: defaultStatus === 'open' ? 'closed' : 'open'
      }])
    });
  };
  var removeDrawerFromHistory = function removeDrawerFromHistory(state) {
    if (!isDrawerInHistory(state)) {
      return state;
    }
    return Object.assign({}, state, {
      history: state.history.filter(function (it) {
        return it.type !== 'drawer';
      })
    });
  };
  var openDrawer = function openDrawer(state) {
    if (defaultStatus === 'open') {
      return removeDrawerFromHistory(state);
    }
    return addDrawerToHistory(state);
  };
  var closeDrawer = function closeDrawer(state) {
    if (defaultStatus === 'open') {
      return addDrawerToHistory(state);
    }
    return removeDrawerFromHistory(state);
  };
  return Object.assign({}, router, {
    type: 'drawer',
    getInitialState: function getInitialState(_ref2) {
      var routeNames = _ref2.routeNames,
        routeParamList = _ref2.routeParamList,
        routeGetIdList = _ref2.routeGetIdList;
      var state = router.getInitialState({
        routeNames: routeNames,
        routeParamList: routeParamList,
        routeGetIdList: routeGetIdList
      });
      return Object.assign({}, state, {
        default: defaultStatus,
        stale: false,
        type: 'drawer',
        key: `drawer-${(0, _nonSecure.nanoid)()}`
      });
    },
    getRehydratedState: function getRehydratedState(partialState, _ref3) {
      var routeNames = _ref3.routeNames,
        routeParamList = _ref3.routeParamList,
        routeGetIdList = _ref3.routeGetIdList;
      if (partialState.stale === false) {
        return partialState;
      }
      var state = router.getRehydratedState(partialState, {
        routeNames: routeNames,
        routeParamList: routeParamList,
        routeGetIdList: routeGetIdList
      });
      if (isDrawerInHistory(partialState)) {
        state = removeDrawerFromHistory(state);
        state = addDrawerToHistory(state);
      }
      return Object.assign({}, state, {
        default: defaultStatus,
        type: 'drawer',
        key: `drawer-${(0, _nonSecure.nanoid)()}`
      });
    },
    getStateForRouteFocus: function getStateForRouteFocus(state, key) {
      var result = router.getStateForRouteFocus(state, key);
      return closeDrawer(result);
    },
    getStateForAction: function getStateForAction(state, action, options) {
      switch (action.type) {
        case 'OPEN_DRAWER':
          return openDrawer(state);
        case 'CLOSE_DRAWER':
          return closeDrawer(state);
        case 'TOGGLE_DRAWER':
          if (isDrawerInHistory(state)) {
            return removeDrawerFromHistory(state);
          }
          return addDrawerToHistory(state);
        case 'JUMP_TO':
        case 'NAVIGATE':
          {
            var result = router.getStateForAction(state, action, options);
            if (result != null && result.index !== state.index) {
              return closeDrawer(result);
            }
            return result;
          }
        case 'GO_BACK':
          if (isDrawerInHistory(state)) {
            return removeDrawerFromHistory(state);
          }
          return router.getStateForAction(state, action, options);
        default:
          return router.getStateForAction(state, action, options);
      }
    },
    actionCreators: DrawerActions
  });
}