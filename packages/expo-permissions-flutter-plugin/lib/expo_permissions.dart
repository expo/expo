import 'dart:async';
import 'package:expo_flutter_adapter/expo_modules_proxy.dart';

/// Use this class's members to specify what permission you are interested in.
class PermissionType {
  static const camera = const PermissionType._fromString('camera');
  static const audioRecording =
      const PermissionType._fromString('audioRecording');
  static const location = const PermissionType._fromString('location');
  static const userFacingNotifications =
      const PermissionType._fromString('userFacingNotifications');
  static const contacts = const PermissionType._fromString('contacts');
  static const cameraRoll = const PermissionType._fromString('cameraRoll');
  static const calendar = const PermissionType._fromString('calendar');
  static const reminders = const PermissionType._fromString('reminders');

  final String _bridgeString;

  const PermissionType._fromString(this._bridgeString);

  String toString() => this._bridgeString;
}

/// The response that comes from asking a user for permissions or checking a permission's status.
class PermissionResponse {
  Map _responseMap;

  PermissionResponse(this._responseMap);

  /// returns a map in the form:
  /// {
  ///   'status': String,
  ///   'expires': String,
  ///   ...additionalRelatedFields
  /// }
  Map<String, dynamic> get(PermissionType type) {
    return Map<String, dynamic>.from(_responseMap[type.toString()]);
  }
}

/// A Flutter plugin for asking the user for sensitive device permissions.
class Permissions {
  /// Returns a response containing the current statuses of the selected permissions.
  static Future<PermissionResponse> get(List<PermissionType> types) async {
    Map response = await ExpoModulesProxy.callMethod('ExpoPermissions',
        'getAsync', [types.map((type) => type.toString()).toList()]);

    return PermissionResponse(response);
  }

  /// Prompts the user to allow or deny a set of permissions.
  /// On iOS, if already asked once, the prompt will not fire.
  static Future<PermissionResponse> ask(List<PermissionType> types) async {
    Map response = await ExpoModulesProxy.callMethod('ExpoPermissions',
        'askAsync', [types.map((type) => type.toString()).toList()]);

    return PermissionResponse(response);
  }
}
