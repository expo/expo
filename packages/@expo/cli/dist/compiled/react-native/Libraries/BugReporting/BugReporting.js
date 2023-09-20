var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../EventEmitter/RCTDeviceEventEmitter"));
var _NativeRedBox = _interopRequireDefault(require("../NativeModules/specs/NativeRedBox"));
var _NativeBugReporting = _interopRequireDefault(require("./NativeBugReporting"));
function defaultExtras() {
  BugReporting.addFileSource('react_hierarchy.txt', function () {
    return require("./dumpReactTree")();
  });
}
var BugReporting = function () {
  function BugReporting() {
    (0, _classCallCheck2.default)(this, BugReporting);
  }
  (0, _createClass2.default)(BugReporting, null, [{
    key: "_maybeInit",
    value: function _maybeInit() {
      if (!BugReporting._subscription) {
        BugReporting._subscription = _RCTDeviceEventEmitter.default.addListener('collectBugExtraData', BugReporting.collectExtraData, null);
        defaultExtras();
      }
      if (!BugReporting._redboxSubscription) {
        BugReporting._redboxSubscription = _RCTDeviceEventEmitter.default.addListener('collectRedBoxExtraData', BugReporting.collectExtraData, null);
      }
    }
  }, {
    key: "addSource",
    value: function addSource(key, callback) {
      return this._addSource(key, callback, BugReporting._extraSources);
    }
  }, {
    key: "addFileSource",
    value: function addFileSource(key, callback) {
      return this._addSource(key, callback, BugReporting._fileSources);
    }
  }, {
    key: "_addSource",
    value: function _addSource(key, callback, source) {
      BugReporting._maybeInit();
      if (source.has(key)) {
        console.warn(`BugReporting.add* called multiple times for same key '${key}'`);
      }
      source.set(key, callback);
      return {
        remove: function remove() {
          source.delete(key);
        }
      };
    }
  }, {
    key: "collectExtraData",
    value: function collectExtraData() {
      var extraData = {};
      for (var _ref3 of BugReporting._extraSources) {
        var _ref2 = (0, _slicedToArray2.default)(_ref3, 2);
        var _key = _ref2[0];
        var callback = _ref2[1];
        extraData[_key] = callback();
      }
      var fileData = {};
      for (var _ref6 of BugReporting._fileSources) {
        var _ref5 = (0, _slicedToArray2.default)(_ref6, 2);
        var _key2 = _ref5[0];
        var _callback = _ref5[1];
        fileData[_key2] = _callback();
      }
      if (_NativeBugReporting.default != null && _NativeBugReporting.default.setExtraData != null) {
        _NativeBugReporting.default.setExtraData(extraData, fileData);
      }
      if (_NativeRedBox.default != null && _NativeRedBox.default.setExtraData != null) {
        _NativeRedBox.default.setExtraData(extraData, 'From BugReporting.js');
      }
      return {
        extras: extraData,
        files: fileData
      };
    }
  }]);
  return BugReporting;
}();
BugReporting._extraSources = new Map();
BugReporting._fileSources = new Map();
BugReporting._subscription = null;
BugReporting._redboxSubscription = null;
module.exports = BugReporting;
//# sourceMappingURL=BugReporting.js.map