var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeSoundManager = _interopRequireDefault(require("./NativeSoundManager"));
var SoundManager = {
  playTouchSound: function playTouchSound() {
    if (_NativeSoundManager.default) {
      _NativeSoundManager.default.playTouchSound();
    }
  }
};
module.exports = SoundManager;