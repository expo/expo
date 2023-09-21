var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeVibration = _interopRequireDefault(require("./NativeVibration"));
var Platform = require('../Utilities/Platform');
var _vibrating = false;
var _id = 0;
var _default_vibration_length = 400;
function vibrateByPattern(pattern) {
  var repeat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  if (_vibrating) {
    return;
  }
  _vibrating = true;
  if (pattern[0] === 0) {
    _NativeVibration.default.vibrate(_default_vibration_length);
    pattern = pattern.slice(1);
  }
  if (pattern.length === 0) {
    _vibrating = false;
    return;
  }
  setTimeout(function () {
    return vibrateScheduler(++_id, pattern, repeat, 1);
  }, pattern[0]);
}
function vibrateScheduler(id, pattern, repeat, nextIndex) {
  if (!_vibrating || id !== _id) {
    return;
  }
  _NativeVibration.default.vibrate(_default_vibration_length);
  if (nextIndex >= pattern.length) {
    if (repeat) {
      nextIndex = 0;
    } else {
      _vibrating = false;
      return;
    }
  }
  setTimeout(function () {
    return vibrateScheduler(id, pattern, repeat, nextIndex + 1);
  }, pattern[nextIndex]);
}
var Vibration = {
  vibrate: function vibrate() {
    var pattern = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _default_vibration_length;
    var repeat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (Platform.OS === 'android') {
      if (typeof pattern === 'number') {
        _NativeVibration.default.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        _NativeVibration.default.vibrateByPattern(pattern, repeat ? 0 : -1);
      } else {
        throw new Error('Vibration pattern should be a number or array');
      }
    } else {
      if (_vibrating) {
        return;
      }
      if (typeof pattern === 'number') {
        _NativeVibration.default.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        vibrateByPattern(pattern, repeat);
      } else {
        throw new Error('Vibration pattern should be a number or array');
      }
    }
  },
  cancel: function cancel() {
    if (Platform.OS === 'ios') {
      _vibrating = false;
    } else {
      _NativeVibration.default.cancel();
    }
  }
};
module.exports = Vibration;