var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _RCTAlertManager = _interopRequireDefault(require("./RCTAlertManager"));
var Alert = function () {
  function Alert() {
    (0, _classCallCheck2.default)(this, Alert);
  }
  (0, _createClass2.default)(Alert, null, [{
    key: "alert",
    value: function alert(title, message, buttons, options) {
      if (_Platform.default.OS === 'ios') {
        Alert.prompt(title, message, buttons, 'default', undefined, undefined, options);
      } else if (_Platform.default.OS === 'android') {
        var NativeDialogManagerAndroid = require('../NativeModules/specs/NativeDialogManagerAndroid').default;
        if (!NativeDialogManagerAndroid) {
          return;
        }
        var constants = NativeDialogManagerAndroid.getConstants();
        var config = {
          title: title || '',
          message: message || '',
          cancelable: false
        };
        if (options && options.cancelable) {
          config.cancelable = options.cancelable;
        }
        var defaultPositiveText = 'OK';
        var validButtons = buttons ? buttons.slice(0, 3) : [{
          text: defaultPositiveText
        }];
        var buttonPositive = validButtons.pop();
        var buttonNegative = validButtons.pop();
        var buttonNeutral = validButtons.pop();
        if (buttonNeutral) {
          config.buttonNeutral = buttonNeutral.text || '';
        }
        if (buttonNegative) {
          config.buttonNegative = buttonNegative.text || '';
        }
        if (buttonPositive) {
          config.buttonPositive = buttonPositive.text || defaultPositiveText;
        }
        var onAction = function onAction(action, buttonKey) {
          if (action === constants.buttonClicked) {
            if (buttonKey === constants.buttonNeutral) {
              buttonNeutral.onPress && buttonNeutral.onPress();
            } else if (buttonKey === constants.buttonNegative) {
              buttonNegative.onPress && buttonNegative.onPress();
            } else if (buttonKey === constants.buttonPositive) {
              buttonPositive.onPress && buttonPositive.onPress();
            }
          } else if (action === constants.dismissed) {
            options && options.onDismiss && options.onDismiss();
          }
        };
        var onError = function onError(errorMessage) {
          return console.warn(errorMessage);
        };
        NativeDialogManagerAndroid.showAlert(config, onError, onAction);
      }
    }
  }, {
    key: "prompt",
    value: function prompt(title, message, callbackOrButtons) {
      var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'plain-text';
      var defaultValue = arguments.length > 4 ? arguments[4] : undefined;
      var keyboardType = arguments.length > 5 ? arguments[5] : undefined;
      var options = arguments.length > 6 ? arguments[6] : undefined;
      if (_Platform.default.OS === 'ios') {
        var callbacks = [];
        var buttons = [];
        var cancelButtonKey;
        var destructiveButtonKey;
        var preferredButtonKey;
        if (typeof callbackOrButtons === 'function') {
          callbacks = [callbackOrButtons];
        } else if (Array.isArray(callbackOrButtons)) {
          callbackOrButtons.forEach(function (btn, index) {
            callbacks[index] = btn.onPress;
            if (btn.style === 'cancel') {
              cancelButtonKey = String(index);
            } else if (btn.style === 'destructive') {
              destructiveButtonKey = String(index);
            }
            if (btn.isPreferred) {
              preferredButtonKey = String(index);
            }
            if (btn.text || index < (callbackOrButtons || []).length - 1) {
              var btnDef = {};
              btnDef[index] = btn.text || '';
              buttons.push(btnDef);
            }
          });
        }
        _RCTAlertManager.default.alertWithArgs({
          title: title || '',
          message: message || undefined,
          buttons: buttons,
          type: type || undefined,
          defaultValue: defaultValue,
          cancelButtonKey: cancelButtonKey,
          destructiveButtonKey: destructiveButtonKey,
          preferredButtonKey: preferredButtonKey,
          keyboardType: keyboardType,
          userInterfaceStyle: (options == null ? void 0 : options.userInterfaceStyle) || undefined
        }, function (id, value) {
          var cb = callbacks[id];
          cb && cb(value);
        });
      }
    }
  }]);
  return Alert;
}();
module.exports = Alert;
//# sourceMappingURL=Alert.js.map