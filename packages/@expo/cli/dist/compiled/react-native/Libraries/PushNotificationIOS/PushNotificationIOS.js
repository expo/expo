var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeEventEmitter = _interopRequireDefault(require("../EventEmitter/NativeEventEmitter"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _NativePushNotificationManagerIOS = _interopRequireDefault(require("./NativePushNotificationManagerIOS"));
var _invariant = _interopRequireDefault(require("invariant"));
var PushNotificationEmitter = new _NativeEventEmitter.default(_Platform.default.OS !== 'ios' ? null : _NativePushNotificationManagerIOS.default);
var _notifHandlers = new Map();
var DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';
var NOTIF_REGISTER_EVENT = 'remoteNotificationsRegistered';
var NOTIF_REGISTRATION_ERROR_EVENT = 'remoteNotificationRegistrationError';
var DEVICE_LOCAL_NOTIF_EVENT = 'localNotificationReceived';
var PushNotificationIOS = function () {
  function PushNotificationIOS(nativeNotif) {
    var _this = this;
    (0, _classCallCheck2.default)(this, PushNotificationIOS);
    this._data = {};
    this._remoteNotificationCompleteCallbackCalled = false;
    this._isRemote = nativeNotif.remote;
    if (this._isRemote) {
      this._notificationId = nativeNotif.notificationId;
    }
    if (nativeNotif.remote) {
      Object.keys(nativeNotif).forEach(function (notifKey) {
        var notifVal = nativeNotif[notifKey];
        if (notifKey === 'aps') {
          _this._alert = notifVal.alert;
          _this._sound = notifVal.sound;
          _this._badgeCount = notifVal.badge;
          _this._category = notifVal.category;
          _this._contentAvailable = notifVal['content-available'];
          _this._threadID = notifVal['thread-id'];
        } else {
          _this._data[notifKey] = notifVal;
        }
      });
    } else {
      this._badgeCount = nativeNotif.applicationIconBadgeNumber;
      this._sound = nativeNotif.soundName;
      this._alert = nativeNotif.alertBody;
      this._data = nativeNotif.userInfo;
      this._category = nativeNotif.category;
    }
  }
  (0, _createClass2.default)(PushNotificationIOS, [{
    key: "finish",
    value: function finish(fetchResult) {
      if (!this._isRemote || !this._notificationId || this._remoteNotificationCompleteCallbackCalled) {
        return;
      }
      this._remoteNotificationCompleteCallbackCalled = true;
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.onFinishRemoteNotification(this._notificationId, fetchResult);
    }
  }, {
    key: "getMessage",
    value: function getMessage() {
      return this._alert;
    }
  }, {
    key: "getSound",
    value: function getSound() {
      return this._sound;
    }
  }, {
    key: "getCategory",
    value: function getCategory() {
      return this._category;
    }
  }, {
    key: "getAlert",
    value: function getAlert() {
      return this._alert;
    }
  }, {
    key: "getContentAvailable",
    value: function getContentAvailable() {
      return this._contentAvailable;
    }
  }, {
    key: "getBadgeCount",
    value: function getBadgeCount() {
      return this._badgeCount;
    }
  }, {
    key: "getData",
    value: function getData() {
      return this._data;
    }
  }, {
    key: "getThreadID",
    value: function getThreadID() {
      return this._threadID;
    }
  }], [{
    key: "presentLocalNotification",
    value: function presentLocalNotification(details) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.presentLocalNotification(details);
    }
  }, {
    key: "scheduleLocalNotification",
    value: function scheduleLocalNotification(details) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.scheduleLocalNotification(details);
    }
  }, {
    key: "cancelAllLocalNotifications",
    value: function cancelAllLocalNotifications() {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.cancelAllLocalNotifications();
    }
  }, {
    key: "removeAllDeliveredNotifications",
    value: function removeAllDeliveredNotifications() {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.removeAllDeliveredNotifications();
    }
  }, {
    key: "getDeliveredNotifications",
    value: function getDeliveredNotifications(callback) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.getDeliveredNotifications(callback);
    }
  }, {
    key: "removeDeliveredNotifications",
    value: function removeDeliveredNotifications(identifiers) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.removeDeliveredNotifications(identifiers);
    }
  }, {
    key: "setApplicationIconBadgeNumber",
    value: function setApplicationIconBadgeNumber(number) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.setApplicationIconBadgeNumber(number);
    }
  }, {
    key: "getApplicationIconBadgeNumber",
    value: function getApplicationIconBadgeNumber(callback) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.getApplicationIconBadgeNumber(callback);
    }
  }, {
    key: "cancelLocalNotifications",
    value: function cancelLocalNotifications(userInfo) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.cancelLocalNotifications(userInfo);
    }
  }, {
    key: "getScheduledLocalNotifications",
    value: function getScheduledLocalNotifications(callback) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.getScheduledLocalNotifications(callback);
    }
  }, {
    key: "addEventListener",
    value: function addEventListener(type, handler) {
      (0, _invariant.default)(type === 'notification' || type === 'register' || type === 'registrationError' || type === 'localNotification', 'PushNotificationIOS only supports `notification`, `register`, `registrationError`, and `localNotification` events');
      var listener;
      if (type === 'notification') {
        listener = PushNotificationEmitter.addListener(DEVICE_NOTIF_EVENT, function (notifData) {
          handler(new PushNotificationIOS(notifData));
        });
      } else if (type === 'localNotification') {
        listener = PushNotificationEmitter.addListener(DEVICE_LOCAL_NOTIF_EVENT, function (notifData) {
          handler(new PushNotificationIOS(notifData));
        });
      } else if (type === 'register') {
        listener = PushNotificationEmitter.addListener(NOTIF_REGISTER_EVENT, function (registrationInfo) {
          handler(registrationInfo.deviceToken);
        });
      } else if (type === 'registrationError') {
        listener = PushNotificationEmitter.addListener(NOTIF_REGISTRATION_ERROR_EVENT, function (errorInfo) {
          handler(errorInfo);
        });
      }
      _notifHandlers.set(type, listener);
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(type, handler) {
      (0, _invariant.default)(type === 'notification' || type === 'register' || type === 'registrationError' || type === 'localNotification', 'PushNotificationIOS only supports `notification`, `register`, `registrationError`, and `localNotification` events');
      var listener = _notifHandlers.get(type);
      if (!listener) {
        return;
      }
      listener.remove();
      _notifHandlers.delete(type);
    }
  }, {
    key: "requestPermissions",
    value: function requestPermissions(permissions) {
      var requestedPermissions = {
        alert: true,
        badge: true,
        sound: true
      };
      if (permissions) {
        requestedPermissions = {
          alert: !!permissions.alert,
          badge: !!permissions.badge,
          sound: !!permissions.sound
        };
      }
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      return _NativePushNotificationManagerIOS.default.requestPermissions(requestedPermissions);
    }
  }, {
    key: "abandonPermissions",
    value: function abandonPermissions() {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.abandonPermissions();
    }
  }, {
    key: "checkPermissions",
    value: function checkPermissions(callback) {
      (0, _invariant.default)(typeof callback === 'function', 'Must provide a valid callback');
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.checkPermissions(callback);
    }
  }, {
    key: "getInitialNotification",
    value: function getInitialNotification() {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      return _NativePushNotificationManagerIOS.default.getInitialNotification().then(function (notification) {
        return notification && new PushNotificationIOS(notification);
      });
    }
  }, {
    key: "getAuthorizationStatus",
    value: function getAuthorizationStatus(callback) {
      (0, _invariant.default)(_NativePushNotificationManagerIOS.default, 'PushNotificationManager is not available.');
      _NativePushNotificationManagerIOS.default.getAuthorizationStatus(callback);
    }
  }]);
  return PushNotificationIOS;
}();
PushNotificationIOS.FetchResult = {
  NewData: 'UIBackgroundFetchResultNewData',
  NoData: 'UIBackgroundFetchResultNoData',
  ResultFailed: 'UIBackgroundFetchResultFailed'
};
module.exports = PushNotificationIOS;