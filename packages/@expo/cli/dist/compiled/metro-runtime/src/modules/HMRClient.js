"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var EventEmitter = require("./vendor/eventemitter3");
var inject = function inject(_ref) {
  var _ref$module = (0, _slicedToArray2.default)(_ref.module, 2),
    id = _ref$module[0],
    code = _ref$module[1],
    sourceURL = _ref.sourceURL;
  if (global.globalEvalWithSourceUrl) {
    global.globalEvalWithSourceUrl(code, sourceURL);
  } else {
    eval(code);
  }
};
var injectUpdate = function injectUpdate(update) {
  update.added.forEach(inject);
  update.modified.forEach(inject);
};
var HMRClient = function (_EventEmitter) {
  (0, _inherits2.default)(HMRClient, _EventEmitter);
  var _super = _createSuper(HMRClient);
  function HMRClient(url) {
    var _this;
    (0, _classCallCheck2.default)(this, HMRClient);
    _this = _super.call(this);
    _this._isEnabled = false;
    _this._pendingUpdate = null;
    _this._queue = [];
    _this._state = "opening";
    _this._ws = new global.WebSocket(url);
    _this._ws.onopen = function () {
      _this._state = "open";
      _this.emit("open");
      _this._flushQueue();
    };
    _this._ws.onerror = function (error) {
      _this.emit("connection-error", error);
    };
    _this._ws.onclose = function (closeEvent) {
      _this._state = "closed";
      _this.emit("close", closeEvent);
    };
    _this._ws.onmessage = function (message) {
      var data = JSON.parse(String(message.data));
      switch (data.type) {
        case "bundle-registered":
          _this.emit("bundle-registered");
          break;
        case "update-start":
          _this.emit("update-start", data.body);
          break;
        case "update":
          _this.emit("update", data.body);
          break;
        case "update-done":
          _this.emit("update-done");
          break;
        case "error":
          _this.emit("error", data.body);
          break;
        default:
          _this.emit("error", {
            type: "unknown-message",
            message: data
          });
      }
    };
    _this.on("update", function (update) {
      if (_this._isEnabled) {
        injectUpdate(update);
      } else if (_this._pendingUpdate == null) {
        _this._pendingUpdate = update;
      } else {
        _this._pendingUpdate = mergeUpdates(_this._pendingUpdate, update);
      }
    });
    return _this;
  }
  (0, _createClass2.default)(HMRClient, [{
    key: "close",
    value: function close() {
      this._ws.close();
    }
  }, {
    key: "send",
    value: function send(message) {
      switch (this._state) {
        case "opening":
          this._queue.push(message);
          break;
        case "open":
          this._ws.send(message);
          break;
        case "closed":
          break;
        default:
          throw new Error("[WebSocketHMRClient] Unknown state: " + this._state);
      }
    }
  }, {
    key: "_flushQueue",
    value: function _flushQueue() {
      var _this2 = this;
      this._queue.forEach(function (message) {
        return _this2.send(message);
      });
      this._queue.length = 0;
    }
  }, {
    key: "enable",
    value: function enable() {
      this._isEnabled = true;
      var update = this._pendingUpdate;
      this._pendingUpdate = null;
      if (update != null) {
        injectUpdate(update);
      }
    }
  }, {
    key: "disable",
    value: function disable() {
      this._isEnabled = false;
    }
  }, {
    key: "isEnabled",
    value: function isEnabled() {
      return this._isEnabled;
    }
  }, {
    key: "hasPendingUpdates",
    value: function hasPendingUpdates() {
      return this._pendingUpdate != null;
    }
  }]);
  return HMRClient;
}(EventEmitter);
function mergeUpdates(base, next) {
  var addedIDs = new Set();
  var deletedIDs = new Set();
  var moduleMap = new Map();
  applyUpdateLocally(base);
  applyUpdateLocally(next);
  function applyUpdateLocally(update) {
    update.deleted.forEach(function (id) {
      if (addedIDs.has(id)) {
        addedIDs.delete(id);
      } else {
        deletedIDs.add(id);
      }
      moduleMap.delete(id);
    });
    update.added.forEach(function (item) {
      var id = item.module[0];
      if (deletedIDs.has(id)) {
        deletedIDs.delete(id);
      } else {
        addedIDs.add(id);
      }
      moduleMap.set(id, item);
    });
    update.modified.forEach(function (item) {
      var id = item.module[0];
      moduleMap.set(id, item);
    });
  }
  var result = {
    isInitialUpdate: next.isInitialUpdate,
    revisionId: next.revisionId,
    added: [],
    modified: [],
    deleted: []
  };
  deletedIDs.forEach(function (id) {
    result.deleted.push(id);
  });
  moduleMap.forEach(function (item, id) {
    if (deletedIDs.has(id)) {
      return;
    }
    if (addedIDs.has(id)) {
      result.added.push(item);
    } else {
      result.modified.push(item);
    }
  });
  return result;
}
module.exports = HMRClient;
//# sourceMappingURL=HMRClient.js.map