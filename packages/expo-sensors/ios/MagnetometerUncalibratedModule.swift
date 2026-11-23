// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// `@Event` needs a string literal, so it repeats this name.
private let EVENT_MAGNETOMETER_DID_UPDATE = "magnetometerUncalibratedDidUpdate"

@ExpoModule("ExponentMagnetometerUncalibrated")
public final class MagnetometerUncalibratedModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  @Event("magnetometerUncalibratedDidUpdate")
  var onMagnetometerUncalibratedUpdate: (ThreeAxisSensorEvent) -> Void

  @JS
  func isAvailableAsync() async -> Bool {
    return motionManager.isMagnetometerAvailable
  }

  @JS
  func setUpdateInterval(intervalMs: Double) async {
    motionManager.magnetometerUpdateInterval = intervalMs
  }

  public override func didStartListening(event: String) {
    guard event == EVENT_MAGNETOMETER_DID_UPDATE, !motionManager.isMagnetometerActive else {
      return
    }
    motionManager.startMagnetometerUpdates(to: operationQueue) { [weak self] data, _ in
      guard let data else {
        return
      }
      self?.onMagnetometerUncalibratedUpdate(ThreeAxisSensorEvent(
        x: data.magneticField.x,
        y: data.magneticField.y,
        z: data.magneticField.z,
        timestamp: data.timestamp
      ))
    }
  }

  public override func didStopListening(event: String) {
    guard event == EVENT_MAGNETOMETER_DID_UPDATE else {
      return
    }
    motionManager.stopMagnetometerUpdates()
  }

  public override func willDestroy() {
    motionManager.stopMagnetometerUpdates()
  }
}
