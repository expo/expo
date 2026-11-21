// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// `@Event` needs a string literal, so it repeats this name.
private let EVENT_ACCELEROMETER_DID_UPDATE = "accelerometerDidUpdate"

@ExpoModule("ExponentAccelerometer")
public final class AccelerometerModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  @Event("accelerometerDidUpdate")
  var onAccelerometerUpdate: (ThreeAxisSensorEvent) -> Void

  @JS
  func isAvailableAsync() async -> Bool {
    return motionManager.isAccelerometerAvailable
  }

  @JS
  func setUpdateInterval(intervalMs: Double) async {
    motionManager.accelerometerUpdateInterval = intervalMs / 1000.0
  }

  public override func didStartListening(event: String) {
    guard event == EVENT_ACCELEROMETER_DID_UPDATE, !motionManager.isAccelerometerActive else {
      return
    }
    motionManager.startAccelerometerUpdates(to: operationQueue) { [weak self] data, _ in
      guard let data else {
        return
      }
      self?.onAccelerometerUpdate(ThreeAxisSensorEvent(
        x: data.acceleration.x,
        y: data.acceleration.y,
        z: data.acceleration.z,
        timestamp: data.timestamp
      ))
    }
  }

  public override func didStopListening(event: String) {
    guard event == EVENT_ACCELEROMETER_DID_UPDATE else {
      return
    }
    motionManager.stopAccelerometerUpdates()
  }

  public override func willDestroy() {
    motionManager.stopAccelerometerUpdates()
  }
}
