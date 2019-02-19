import 'dart:async';

import 'package:expo_flutter_adapter/expo_flutter_adapter.dart';

class GyroscopeEvent {
  final double x, y, z;

  GyroscopeEvent._fromMap(Map<String, dynamic> map)
      : x = map['x'],
        y = map['y'],
        z = map['z'];
}

class Gyroscope {
  static final Stream<GyroscopeEvent> events = ExpoModulesProxy.events
      .where((ExpoEvent e) => e.name == 'gyroscopeDidUpdate')
      .map((ExpoEvent e) => new GyroscopeEvent._fromMap(e.body))
      .asBroadcastStream(
        onListen: (_) =>
            ExpoModulesProxy.callMethod('ExponentGyroscope', 'startObserving'),
        onCancel: (_) =>
            ExpoModulesProxy.callMethod('ExponentGyroscope', 'stopObserving'),
      );

  static Future<dynamic> setUpdateInterval(Duration interval) =>
      ExpoModulesProxy.callMethod('ExponentGyroscope', 'setUpdateInterval', [
        interval.inMilliseconds,
      ]);
}
