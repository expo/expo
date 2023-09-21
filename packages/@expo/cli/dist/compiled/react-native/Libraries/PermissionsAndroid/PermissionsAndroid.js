var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeDialogManagerAndroid = _interopRequireDefault(require("../NativeModules/specs/NativeDialogManagerAndroid"));
var _NativePermissionsAndroid = _interopRequireDefault(require("./NativePermissionsAndroid"));
var _invariant = _interopRequireDefault(require("invariant"));
var Platform = require('../Utilities/Platform');
var PERMISSION_REQUEST_RESULT = Object.freeze({
  GRANTED: 'granted',
  DENIED: 'denied',
  NEVER_ASK_AGAIN: 'never_ask_again'
});
var PERMISSIONS = Object.freeze({
  READ_CALENDAR: 'android.permission.READ_CALENDAR',
  WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR',
  CAMERA: 'android.permission.CAMERA',
  READ_CONTACTS: 'android.permission.READ_CONTACTS',
  WRITE_CONTACTS: 'android.permission.WRITE_CONTACTS',
  GET_ACCOUNTS: 'android.permission.GET_ACCOUNTS',
  ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
  ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
  RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
  READ_PHONE_STATE: 'android.permission.READ_PHONE_STATE',
  CALL_PHONE: 'android.permission.CALL_PHONE',
  READ_CALL_LOG: 'android.permission.READ_CALL_LOG',
  WRITE_CALL_LOG: 'android.permission.WRITE_CALL_LOG',
  ADD_VOICEMAIL: 'com.android.voicemail.permission.ADD_VOICEMAIL',
  READ_VOICEMAIL: 'com.android.voicemail.permission.READ_VOICEMAIL',
  WRITE_VOICEMAIL: 'com.android.voicemail.permission.WRITE_VOICEMAIL',
  USE_SIP: 'android.permission.USE_SIP',
  PROCESS_OUTGOING_CALLS: 'android.permission.PROCESS_OUTGOING_CALLS',
  BODY_SENSORS: 'android.permission.BODY_SENSORS',
  BODY_SENSORS_BACKGROUND: 'android.permission.BODY_SENSORS_BACKGROUND',
  SEND_SMS: 'android.permission.SEND_SMS',
  RECEIVE_SMS: 'android.permission.RECEIVE_SMS',
  READ_SMS: 'android.permission.READ_SMS',
  RECEIVE_WAP_PUSH: 'android.permission.RECEIVE_WAP_PUSH',
  RECEIVE_MMS: 'android.permission.RECEIVE_MMS',
  READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
  READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
  READ_MEDIA_VIDEO: 'android.permission.READ_MEDIA_VIDEO',
  READ_MEDIA_AUDIO: 'android.permission.READ_MEDIA_AUDIO',
  WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
  BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
  BLUETOOTH_ADVERTISE: 'android.permission.BLUETOOTH_ADVERTISE',
  ACCESS_MEDIA_LOCATION: 'android.permission.ACCESS_MEDIA_LOCATION',
  ACCEPT_HANDOVER: 'android.permission.ACCEPT_HANDOVER',
  ACTIVITY_RECOGNITION: 'android.permission.ACTIVITY_RECOGNITION',
  ANSWER_PHONE_CALLS: 'android.permission.ANSWER_PHONE_CALLS',
  READ_PHONE_NUMBERS: 'android.permission.READ_PHONE_NUMBERS',
  UWB_RANGING: 'android.permission.UWB_RANGING',
  POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  NEARBY_WIFI_DEVICES: 'android.permission.NEARBY_WIFI_DEVICES'
});
var PermissionsAndroid = function () {
  function PermissionsAndroid() {
    (0, _classCallCheck2.default)(this, PermissionsAndroid);
    this.PERMISSIONS = PERMISSIONS;
    this.RESULTS = PERMISSION_REQUEST_RESULT;
  }
  (0, _createClass2.default)(PermissionsAndroid, [{
    key: "checkPermission",
    value: function checkPermission(permission) {
      console.warn('"PermissionsAndroid.checkPermission" is deprecated. Use "PermissionsAndroid.check" instead');
      if (Platform.OS !== 'android') {
        console.warn('"PermissionsAndroid" module works only for Android platform.');
        return Promise.resolve(false);
      }
      (0, _invariant.default)(_NativePermissionsAndroid.default, 'PermissionsAndroid is not installed correctly.');
      return _NativePermissionsAndroid.default.checkPermission(permission);
    }
  }, {
    key: "check",
    value: function check(permission) {
      if (Platform.OS !== 'android') {
        console.warn('"PermissionsAndroid" module works only for Android platform.');
        return Promise.resolve(false);
      }
      (0, _invariant.default)(_NativePermissionsAndroid.default, 'PermissionsAndroid is not installed correctly.');
      return _NativePermissionsAndroid.default.checkPermission(permission);
    }
  }, {
    key: "requestPermission",
    value: function () {
      var _requestPermission = (0, _asyncToGenerator2.default)(function* (permission, rationale) {
        console.warn('"PermissionsAndroid.requestPermission" is deprecated. Use "PermissionsAndroid.request" instead');
        if (Platform.OS !== 'android') {
          console.warn('"PermissionsAndroid" module works only for Android platform.');
          return Promise.resolve(false);
        }
        var response = yield this.request(permission, rationale);
        return response === this.RESULTS.GRANTED;
      });
      function requestPermission(_x, _x2) {
        return _requestPermission.apply(this, arguments);
      }
      return requestPermission;
    }()
  }, {
    key: "request",
    value: function () {
      var _request = (0, _asyncToGenerator2.default)(function* (permission, rationale) {
        if (Platform.OS !== 'android') {
          console.warn('"PermissionsAndroid" module works only for Android platform.');
          return Promise.resolve(this.RESULTS.DENIED);
        }
        (0, _invariant.default)(_NativePermissionsAndroid.default, 'PermissionsAndroid is not installed correctly.');
        if (rationale) {
          var shouldShowRationale = yield _NativePermissionsAndroid.default.shouldShowRequestPermissionRationale(permission);
          if (shouldShowRationale && !!_NativeDialogManagerAndroid.default) {
            return new Promise(function (resolve, reject) {
              var options = Object.assign({}, rationale);
              _NativeDialogManagerAndroid.default.showAlert(options, function () {
                return reject(new Error('Error showing rationale'));
              }, function () {
                return resolve(_NativePermissionsAndroid.default.requestPermission(permission));
              });
            });
          }
        }
        return _NativePermissionsAndroid.default.requestPermission(permission);
      });
      function request(_x3, _x4) {
        return _request.apply(this, arguments);
      }
      return request;
    }()
  }, {
    key: "requestMultiple",
    value: function requestMultiple(permissions) {
      if (Platform.OS !== 'android') {
        console.warn('"PermissionsAndroid" module works only for Android platform.');
        return Promise.resolve({});
      }
      (0, _invariant.default)(_NativePermissionsAndroid.default, 'PermissionsAndroid is not installed correctly.');
      return _NativePermissionsAndroid.default.requestMultiplePermissions(permissions);
    }
  }]);
  return PermissionsAndroid;
}();
var PermissionsAndroidInstance = new PermissionsAndroid();
module.exports = PermissionsAndroidInstance;