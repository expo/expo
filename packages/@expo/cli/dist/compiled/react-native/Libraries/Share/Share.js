var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeActionSheetManager = _interopRequireDefault(require("../ActionSheetIOS/NativeActionSheetManager"));
var _NativeShareModule = _interopRequireDefault(require("./NativeShareModule"));
var processColor = require('../StyleSheet/processColor').default;
var Platform = require('../Utilities/Platform');
var invariant = require('invariant');
var Share = function () {
  function Share() {
    (0, _classCallCheck2.default)(this, Share);
  }
  (0, _createClass2.default)(Share, null, [{
    key: "share",
    value: function share(content) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      invariant(typeof content === 'object' && content !== null, 'Content to share must be a valid object');
      invariant(typeof content.url === 'string' || typeof content.message === 'string', 'At least one of URL and message is required');
      invariant(typeof options === 'object' && options !== null, 'Options must be a valid object');
      if (Platform.OS === 'android') {
        invariant(_NativeShareModule.default, 'ShareModule should be registered on Android.');
        invariant(content.title == null || typeof content.title === 'string', 'Invalid title: title should be a string.');
        var newContent = {
          title: content.title,
          message: typeof content.message === 'string' ? content.message : undefined
        };
        return _NativeShareModule.default.share(newContent, options.dialogTitle).then(function (result) {
          return Object.assign({
            activityType: null
          }, result);
        });
      } else if (Platform.OS === 'ios') {
        return new Promise(function (resolve, reject) {
          var tintColor = processColor(options.tintColor);
          invariant(tintColor == null || typeof tintColor === 'number', 'Unexpected color given for options.tintColor');
          invariant(_NativeActionSheetManager.default, 'NativeActionSheetManager is not registered on iOS, but it should be.');
          _NativeActionSheetManager.default.showShareActionSheetWithOptions({
            message: typeof content.message === 'string' ? content.message : undefined,
            url: typeof content.url === 'string' ? content.url : undefined,
            subject: options.subject,
            tintColor: typeof tintColor === 'number' ? tintColor : undefined,
            anchor: typeof options.anchor === 'number' ? options.anchor : undefined,
            excludedActivityTypes: options.excludedActivityTypes
          }, function (error) {
            return reject(error);
          }, function (success, activityType) {
            if (success) {
              resolve({
                action: 'sharedAction',
                activityType: activityType
              });
            } else {
              resolve({
                action: 'dismissedAction',
                activityType: null
              });
            }
          });
        });
      } else {
        return Promise.reject(new Error('Unsupported platform'));
      }
    }
  }]);
  return Share;
}();
Share.sharedAction = 'sharedAction';
Share.dismissedAction = 'dismissedAction';
module.exports = Share;
//# sourceMappingURL=Share.js.map