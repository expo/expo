import 'dart:async';

import 'package:expo_flutter_adapter/expo_flutter_adapter.dart';

class DeviceMotionEvent {
  final Map acceleration;
  final Map accelerationIncludingGravity;
  final Map rotation;
  final Map rotationRate;
  final int orientation;

  DeviceMotionEvent._fromMap(Map<String, dynamic> map)
      : acceleration = map['acceleration'],
        accelerationIncludingGravity = map['accelerationIncludingGravity'],
        rotation = map['rotation'],
        rotationRate = map['rotationRate'],
        orientation = map['orientation'];
}

class DeviceMotion {
  static final Stream<DeviceMotionEvent> events = ExpoModulesProxy.events
      .where((ExpoEvent e) => e.name == 'deviceMotionDidUpdate')
      .map((ExpoEvent e) => new DeviceMotionEvent._fromMap(e.body))
      .asBroadcastStream(
        onListen: (_) => ExpoModulesProxy.callMethod(
            'ExponentDeviceMotion', 'startObserving'),
        onCancel: (_) => ExpoModulesProxy.callMethod(
            'ExponentDeviceMotion', 'stopObserving'),
      );

  static Future<dynamic> setUpdateInterval(Duration interval) =>
      ExpoModulesProxy.callMethod('ExponentDeviceMotion', 'setUpdateInterval', [
        interval.inMilliseconds,
      ]);

  static Future<double> getGravity() async {
    return (await ExpoModulesProxy.getConstant(
        "ExponentDeviceMotion", "Gravity")) as double;
  }
}
