// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore

@Record
struct ThreeAxisSensorEvent {
  var x: Double
  var y: Double
  var z: Double
  var timestamp: Double
}

@Record
struct BarometerEvent {
  var pressure: Double
  var relativeAltitude: Double
  var timestamp: Double
}

@Record
struct RotationEvent {
  var alpha: Double
  var beta: Double
  var gamma: Double
  var timestamp: Double
}

@Record
struct DeviceMotionEvent {
  var acceleration: ThreeAxisSensorEvent
  var accelerationIncludingGravity: ThreeAxisSensorEvent
  var rotation: RotationEvent
  var rotationRate: RotationEvent
  var orientation: Int
  var interval: Double
}

@Record
struct PedometerResult {
  var steps: Int
}

enum PedometerEventType: String, Enumerable {
  case pause
  case resume
}

@Record
struct PedometerEvent {
  var type: PedometerEventType
  var date: Double
}
