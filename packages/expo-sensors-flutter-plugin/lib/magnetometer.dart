import 'dart:async';

import 'package:expo_flutter_adapter/expo_flutter_adapter.dart';

class MagnetometerEvent {
  final double x, y, z;

  MagnetometerEvent._fromMap(Map<String, dynamic> map)
      : x = map['x'],
        y = map['y'],
        z = map['z'];
}

class Magnetometer {
  static final Stream<MagnetometerEvent> events = ExpoModulesProxy.events
      .where((ExpoEvent e) => e.name == 'magnetometerDidUpdate')
      .map((ExpoEvent e) => new MagnetometerEvent._fromMap(e.body))
      .asBroadcastStream(
        onListen: (_) => ExpoModulesProxy.callMethod(
            'ExponentMagnetometer', 'startObserving'),
        onCancel: (_) => ExpoModulesProxy.callMethod(
            'ExponentMagnetometer', 'stopObserving'),
      );

  static Future<dynamic> setUpdateInterval(Duration interval) =>
      ExpoModulesProxy.callMethod('ExponentMagnetometer', 'setUpdateInterval', [
        interval.inMilliseconds,
      ]);
}
