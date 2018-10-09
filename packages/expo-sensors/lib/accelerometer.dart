import 'dart:async';

import 'package:expo_flutter_adapter/expo_modules_proxy.dart';

class AccelerometerEvent {
  final double x, y, z;

  AccelerometerEvent._fromMap(Map<String, dynamic> map)
      : x = map['x'],
        y = map['y'],
        z = map['z'];
}

class Accelerometer {
  static final Stream<AccelerometerEvent> events = ExpoModulesProxy.events
      .where((ExpoEvent e) => e.name == 'accelerometerDidUpdate')
      .map((ExpoEvent e) => new AccelerometerEvent._fromMap(e.body))
      .asBroadcastStream(
        onListen: (_) => ExpoModulesProxy
            .callMethod('ExponentAccelerometer', 'startObserving', []),
        onCancel: (_) => ExpoModulesProxy
            .callMethod('ExponentAccelerometer', 'stopObserving', []),
      );

  static Future<Null> setUpdateInterval(Duration interval) => ExpoModulesProxy
          .callMethod('ExponentAccelerometer', 'setUpdateInterval', [
        interval.inMilliseconds,
      ]);
}
