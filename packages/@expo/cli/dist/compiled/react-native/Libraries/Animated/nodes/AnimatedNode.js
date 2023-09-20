'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeAnimatedHelper = _interopRequireDefault(require("../NativeAnimatedHelper"));
var _invariant = _interopRequireDefault(require("invariant"));
var NativeAnimatedAPI = _NativeAnimatedHelper.default.API;
var _uniqueId = 1;
var AnimatedNode = function () {
  function AnimatedNode() {
    (0, _classCallCheck2.default)(this, AnimatedNode);
    this._listeners = {};
  }
  (0, _createClass2.default)(AnimatedNode, [{
    key: "__attach",
    value: function __attach() {}
  }, {
    key: "__detach",
    value: function __detach() {
      this.removeAllListeners();
      if (this.__isNative && this.__nativeTag != null) {
        _NativeAnimatedHelper.default.API.dropAnimatedNode(this.__nativeTag);
        this.__nativeTag = undefined;
      }
    }
  }, {
    key: "__getValue",
    value: function __getValue() {}
  }, {
    key: "__getAnimatedValue",
    value: function __getAnimatedValue() {
      return this.__getValue();
    }
  }, {
    key: "__addChild",
    value: function __addChild(child) {}
  }, {
    key: "__removeChild",
    value: function __removeChild(child) {}
  }, {
    key: "__getChildren",
    value: function __getChildren() {
      return [];
    }
  }, {
    key: "__makeNative",
    value: function __makeNative(platformConfig) {
      if (!this.__isNative) {
        throw new Error('This node cannot be made a "native" animated node');
      }
      this._platformConfig = platformConfig;
      if (this.hasListeners()) {
        this._startListeningToNativeValueUpdates();
      }
    }
  }, {
    key: "addListener",
    value: function addListener(callback) {
      var id = String(_uniqueId++);
      this._listeners[id] = callback;
      if (this.__isNative) {
        this._startListeningToNativeValueUpdates();
      }
      return id;
    }
  }, {
    key: "removeListener",
    value: function removeListener(id) {
      delete this._listeners[id];
      if (this.__isNative && !this.hasListeners()) {
        this._stopListeningForNativeValueUpdates();
      }
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners() {
      this._listeners = {};
      if (this.__isNative) {
        this._stopListeningForNativeValueUpdates();
      }
    }
  }, {
    key: "hasListeners",
    value: function hasListeners() {
      return !!Object.keys(this._listeners).length;
    }
  }, {
    key: "_startListeningToNativeValueUpdates",
    value: function _startListeningToNativeValueUpdates() {
      var _this = this;
      if (this.__nativeAnimatedValueListener && !this.__shouldUpdateListenersForNewNativeTag) {
        return;
      }
      if (this.__shouldUpdateListenersForNewNativeTag) {
        this.__shouldUpdateListenersForNewNativeTag = false;
        this._stopListeningForNativeValueUpdates();
      }
      NativeAnimatedAPI.startListeningToAnimatedNodeValue(this.__getNativeTag());
      this.__nativeAnimatedValueListener = _NativeAnimatedHelper.default.nativeEventEmitter.addListener('onAnimatedValueUpdate', function (data) {
        if (data.tag !== _this.__getNativeTag()) {
          return;
        }
        _this.__onAnimatedValueUpdateReceived(data.value);
      });
    }
  }, {
    key: "__onAnimatedValueUpdateReceived",
    value: function __onAnimatedValueUpdateReceived(value) {
      this.__callListeners(value);
    }
  }, {
    key: "__callListeners",
    value: function __callListeners(value) {
      for (var _key in this._listeners) {
        this._listeners[_key]({
          value: value
        });
      }
    }
  }, {
    key: "_stopListeningForNativeValueUpdates",
    value: function _stopListeningForNativeValueUpdates() {
      if (!this.__nativeAnimatedValueListener) {
        return;
      }
      this.__nativeAnimatedValueListener.remove();
      this.__nativeAnimatedValueListener = null;
      NativeAnimatedAPI.stopListeningToAnimatedNodeValue(this.__getNativeTag());
    }
  }, {
    key: "__getNativeTag",
    value: function __getNativeTag() {
      var _this$__nativeTag;
      _NativeAnimatedHelper.default.assertNativeAnimatedModule();
      (0, _invariant.default)(this.__isNative, 'Attempt to get native tag from node not marked as "native"');
      var nativeTag = (_this$__nativeTag = this.__nativeTag) != null ? _this$__nativeTag : _NativeAnimatedHelper.default.generateNewNodeTag();
      if (this.__nativeTag == null) {
        this.__nativeTag = nativeTag;
        var config = this.__getNativeConfig();
        if (this._platformConfig) {
          config.platformConfig = this._platformConfig;
        }
        _NativeAnimatedHelper.default.API.createAnimatedNode(nativeTag, config);
        this.__shouldUpdateListenersForNewNativeTag = true;
      }
      return nativeTag;
    }
  }, {
    key: "__getNativeConfig",
    value: function __getNativeConfig() {
      throw new Error('This JS animated node type cannot be used as native animated node');
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.__getValue();
    }
  }, {
    key: "__getPlatformConfig",
    value: function __getPlatformConfig() {
      return this._platformConfig;
    }
  }, {
    key: "__setPlatformConfig",
    value: function __setPlatformConfig(platformConfig) {
      this._platformConfig = platformConfig;
    }
  }]);
  return AnimatedNode;
}();
exports.default = AnimatedNode;
//# sourceMappingURL=AnimatedNode.js.map