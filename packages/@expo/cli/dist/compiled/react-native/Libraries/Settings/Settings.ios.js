var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../EventEmitter/RCTDeviceEventEmitter"));
var _NativeSettingsManager = _interopRequireDefault(require("./NativeSettingsManager"));
var _invariant = _interopRequireDefault(require("invariant"));
var subscriptions = [];
var Settings = {
  _settings: _NativeSettingsManager.default && _NativeSettingsManager.default.getConstants().settings,
  get: function get(key) {
    return this._settings[key];
  },
  set: function set(settings) {
    this._settings = Object.assign(this._settings, settings);
    _NativeSettingsManager.default.setValues(settings);
  },
  watchKeys: function watchKeys(keys, callback) {
    if (typeof keys === 'string') {
      keys = [keys];
    }
    (0, _invariant.default)(Array.isArray(keys), 'keys should be a string or array of strings');
    var sid = subscriptions.length;
    subscriptions.push({
      keys: keys,
      callback: callback
    });
    return sid;
  },
  clearWatch: function clearWatch(watchId) {
    if (watchId < subscriptions.length) {
      subscriptions[watchId] = {
        keys: [],
        callback: null
      };
    }
  },
  _sendObservations: function _sendObservations(body) {
    var _this = this;
    Object.keys(body).forEach(function (key) {
      var newValue = body[key];
      var didChange = _this._settings[key] !== newValue;
      _this._settings[key] = newValue;
      if (didChange) {
        subscriptions.forEach(function (sub) {
          if (sub.keys.indexOf(key) !== -1 && sub.callback) {
            sub.callback();
          }
        });
      }
    });
  }
};
_RCTDeviceEventEmitter.default.addListener('settingsUpdated', Settings._sendObservations.bind(Settings));
module.exports = Settings;