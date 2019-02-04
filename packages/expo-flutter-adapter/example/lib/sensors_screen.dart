import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'dart:async';
import 'package:expo_sensors/accelerometer.dart';
import 'package:expo_sensors/device_motion.dart';
import 'package:expo_sensors/gyroscope.dart';
import 'package:expo_sensors/magnetometer.dart';
import 'package:expo_sensors/pedometer.dart';

class SensorsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text("Sensors Unimodule Demo"),
        ),
        body: SingleChildScrollView(
            child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height,
                ),
                child: Center(
                    child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    AccelerometerWidget(),
                    GyroscopeWidget(),
                    MagnetometerWidget(),
                    DeviceMotionWidget(),
                    PedometerWidget()
                  ],
                )))));
  }
}

class AccelerometerWidget extends StatefulWidget {
  @override
  _AccelerometerWidgetState createState() => _AccelerometerWidgetState();
}

class _AccelerometerWidgetState extends State<AccelerometerWidget> {
  AccelerometerEvent event;
  StreamSubscription<AccelerometerEvent> subscription;

  @override
  initState() {
    super.initState();
    subscription = Accelerometer.events.listen((e) {
      setState(() {
        event = e;
      });
    });
  }

  @override
  dispose() {
    super.dispose();
    subscription.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: <Widget>[
      Text(
        "Accelerometer",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      event != null
          ? Column(
              children: <Widget>[
                Text(
                  "x: ${event.x.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "y: ${event.y.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "z: ${event.z.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
              ],
            )
          : Text(
              "Accelerometer hasn't sent an event yet.",
              textAlign: TextAlign.center,
            ),
      Padding(
        padding: EdgeInsets.only(
          bottom: 8,
        ),
      )
    ]);
  }
}

class GyroscopeWidget extends StatefulWidget {
  @override
  _GyroscopeWidgetState createState() => _GyroscopeWidgetState();
}

class _GyroscopeWidgetState extends State<GyroscopeWidget> {
  GyroscopeEvent event;
  StreamSubscription<GyroscopeEvent> subscription;

  @override
  initState() {
    super.initState();
    subscription = Gyroscope.events.listen((e) {
      setState(() {
        event = e;
      });
    });
  }

  @override
  dispose() {
    super.dispose();
    subscription.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: <Widget>[
      Text(
        "Gyroscope",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      event != null
          ? Column(
              children: <Widget>[
                Text(
                  "x: ${event.x.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "y: ${event.y.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "z: ${event.z.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
              ],
            )
          : Text(
              "Gyroscope hasn't sent an event yet.",
              textAlign: TextAlign.center,
            ),
      Padding(
        padding: EdgeInsets.only(
          bottom: 8,
        ),
      )
    ]);
  }
}

class MagnetometerWidget extends StatefulWidget {
  @override
  _MagnetometerWidgetState createState() => _MagnetometerWidgetState();
}

class _MagnetometerWidgetState extends State<MagnetometerWidget> {
  MagnetometerEvent event;
  StreamSubscription<MagnetometerEvent> subscription;

  @override
  initState() {
    super.initState();
    subscription = Magnetometer.events.listen((e) {
      setState(() {
        event = e;
      });
    });
  }

  @override
  dispose() {
    super.dispose();
    subscription.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: <Widget>[
      Text(
        "Magnetometer",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      event != null
          ? Column(
              children: <Widget>[
                Text(
                  "x: ${event.x.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "y: ${event.y.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "z: ${event.z.toStringAsFixed(12)}",
                  textAlign: TextAlign.center,
                ),
              ],
            )
          : Text(
              "Magnetometer hasn't sent an event yet.",
              textAlign: TextAlign.center,
            ),
      Padding(
        padding: EdgeInsets.only(
          bottom: 8,
        ),
      )
    ]);
  }
}

class DeviceMotionWidget extends StatefulWidget {
  @override
  _DeviceMotionWidgetState createState() => _DeviceMotionWidgetState();
}

class _DeviceMotionWidgetState extends State<DeviceMotionWidget> {
  DeviceMotionEvent event;
  StreamSubscription<DeviceMotionEvent> subscription;

  @override
  initState() {
    super.initState();
    subscription = DeviceMotion.events.listen((e) {
      setState(() {
        event = e;
      });
    });
  }

  @override
  dispose() {
    super.dispose();
    subscription.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: <Widget>[
      Text(
        "DeviceMotion",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      event != null
          ? Column(
              children: <Widget>[
                Text(
                  "acceleration: ${event.acceleration}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "accelerationIncludingGravity: ${event.accelerationIncludingGravity}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "rotation: ${event.rotation}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "rotationRate: ${event.rotationRate}",
                  textAlign: TextAlign.center,
                ),
                Text(
                  "orientation: ${event.orientation}",
                  textAlign: TextAlign.center,
                ),
              ],
            )
          : Text(
              "DeviceMotion hasn't sent an event yet.",
              textAlign: TextAlign.center,
            ),
      Padding(
        padding: EdgeInsets.only(
          bottom: 8,
        ),
      )
    ]);
  }
}

class PedometerWidget extends StatefulWidget {
  @override
  _PedometerWidgetState createState() {
    Pedometer.getAvailability();
    return _PedometerWidgetState();
  }
}

class _PedometerWidgetState extends State<PedometerWidget> {
  PedometerEvent event;
  bool isAvailable = false;
  int stepsSinceYesterday = 0;
  StreamSubscription<PedometerEvent> subscription;

  @override
  initState() {
    super.initState();

    Pedometer.getStepCount(
            DateTime.now().subtract(Duration(days: 1)), DateTime.now())
        .then((stepCount) {
      setState(() => stepsSinceYesterday = stepCount);
    });

    Pedometer.getAvailability().then((b) {
      if (b) {
        setState(() => this.isAvailable = b);

        subscription = Pedometer.events.listen((e) {
          setState(() {
            event = e;
          });
        });
      }
    });
  }

  @override
  dispose() {
    super.dispose();
    subscription.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: <Widget>[
      Text(
        "Pedometer",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      (isAvailable && event != null)
          ? Column(
              children: <Widget>[
                Text(
                  "steps: ${event.steps}",
                  textAlign: TextAlign.center,
                ),
              ],
            )
          : isAvailable
              ? Text(
                  "Pedometer hasn't sent an event yet, but your step count since yesterday is $stepsSinceYesterday",
                  textAlign: TextAlign.center,
                )
              : Text(
                  "Pedometer isn't available on this device.",
                  textAlign: TextAlign.center,
                ),
      Padding(
        padding: EdgeInsets.only(
          bottom: 8,
        ),
      )
    ]);
  }
}
