var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _NativeActionSheetManager = _interopRequireDefault(require("./NativeActionSheetManager"));
var _excluded = ["tintColor", "cancelButtonTintColor", "destructiveButtonIndex"];
var processColor = require('../StyleSheet/processColor').default;
var invariant = require('invariant');
var ActionSheetIOS = {
  showActionSheetWithOptions: function showActionSheetWithOptions(options, callback) {
    invariant(typeof options === 'object' && options !== null, 'Options must be a valid object');
    invariant(typeof callback === 'function', 'Must provide a valid callback');
    invariant(_NativeActionSheetManager.default, "ActionSheetManager doesn't exist");
    var tintColor = options.tintColor,
      cancelButtonTintColor = options.cancelButtonTintColor,
      destructiveButtonIndex = options.destructiveButtonIndex,
      remainingOptions = (0, _objectWithoutProperties2.default)(options, _excluded);
    var destructiveButtonIndices = null;
    if (Array.isArray(destructiveButtonIndex)) {
      destructiveButtonIndices = destructiveButtonIndex;
    } else if (typeof destructiveButtonIndex === 'number') {
      destructiveButtonIndices = [destructiveButtonIndex];
    }
    var processedTintColor = processColor(tintColor);
    var processedCancelButtonTintColor = processColor(cancelButtonTintColor);
    invariant(processedTintColor == null || typeof processedTintColor === 'number', 'Unexpected color given for ActionSheetIOS.showActionSheetWithOptions tintColor');
    invariant(processedCancelButtonTintColor == null || typeof processedCancelButtonTintColor === 'number', 'Unexpected color given for ActionSheetIOS.showActionSheetWithOptions cancelButtonTintColor');
    _NativeActionSheetManager.default.showActionSheetWithOptions(Object.assign({}, remainingOptions, {
      tintColor: processedTintColor,
      cancelButtonTintColor: processedCancelButtonTintColor,
      destructiveButtonIndices: destructiveButtonIndices
    }), callback);
  },
  showShareActionSheetWithOptions: function showShareActionSheetWithOptions(options, failureCallback, successCallback) {
    invariant(typeof options === 'object' && options !== null, 'Options must be a valid object');
    invariant(typeof failureCallback === 'function', 'Must provide a valid failureCallback');
    invariant(typeof successCallback === 'function', 'Must provide a valid successCallback');
    invariant(_NativeActionSheetManager.default, "ActionSheetManager doesn't exist");
    _NativeActionSheetManager.default.showShareActionSheetWithOptions(Object.assign({}, options, {
      tintColor: processColor(options.tintColor)
    }), failureCallback, successCallback);
  },
  dismissActionSheet: function dismissActionSheet() {
    invariant(_NativeActionSheetManager.default, "ActionSheetManager doesn't exist");
    if (typeof _NativeActionSheetManager.default.dismissActionSheet === 'function') {
      _NativeActionSheetManager.default.dismissActionSheet();
    }
  }
};
module.exports = ActionSheetIOS;