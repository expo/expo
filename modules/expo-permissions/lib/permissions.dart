import 'dart:async';

import 'package:expo_flutter_adapter/expo_modules_proxy.dart';

class PermissionType {
  static const camera = const PermissionType._fromString('camera');
  static const audioRecording = const PermissionType._fromString(
      'audioRecording');
  static const location = const PermissionType._fromString('location');
  static const userFacingNotifications = const PermissionType._fromString(
      'userFacingNotifications');
  static const notifications = const PermissionType._fromString(
      'notifications');
  static const contacts = const PermissionType._fromString('contacts');
  static const systemBrightness = const PermissionType._fromString(
      'systemBrightness');
  static const cameraRoll = const PermissionType._fromString('cameraRoll');
  static const calendar = const PermissionType._fromString('calendar');
  static const reminders = const PermissionType._fromString('reminders');

  final String _bridgeString;

  const PermissionType._fromString(this._bridgeString);

  String _toString() => this._bridgeString;
}

class PermissionStatus {
  static const undetermined = const PermissionStatus._fromString('undetermined');
  static const granted = const PermissionStatus._fromString(
      'granted');
  static const denied = const PermissionStatus._fromString('denied');

  final String _bridgeString;

  const PermissionStatus._fromString(this._bridgeString);

  String _toString() => this._bridgeString;
}

class PermissionExpires {
  static const never = const PermissionExpires._fromString('never');

  final String _bridgeString;

  const PermissionExpires._fromString(this._bridgeString);

  String _toString() => this._bridgeString;
}

class PermissionResponse {
  final PermissionStatus status;
  final PermissionExpires expires;
  final Map ios;
  final Map android;

  PermissionResponse._fromMap(Map map)
      : status = PermissionStatus._fromString(map['status']),
        expires = PermissionExpires._fromString(map['expires']),
        ios = map['ios'],
        android = map['android'];
}

class Permissions {
  static Future<PermissionResponse> get(PermissionType type) async =>
      PermissionResponse._fromMap(await ExpoModulesProxy.callMethod(
          'ExponentPermissions', 'getAsync', [type._toString()]));

  static Future<PermissionResponse> ask(PermissionType type) async =>
      PermissionResponse._fromMap(await ExpoModulesProxy.callMethod(
          'ExponentPermissions', 'askAsync', [type._toString()]));
}
