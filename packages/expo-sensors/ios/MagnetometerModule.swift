// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// `@Event` needs a string literal, so it repeats this name.
private let EVENT_MAGNETOMETER_DID_UPDATE = "magnetometerDidUpdate"

@ExpoModule("ExponentMagnetometer")
public final class MagnetometerModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  @Event("magnetometerDidUpdate")
  var onMagnetometerUpdate: (ThreeAxisSensorEvent) -> Void

  @JS
  func isAvailableAsync() async -> Bool {
    return motionManager.isDeviceMotionAvailable
  }

  @JS
  func setUpdateInterval(intervalMs: Double) async {
    motionManager.deviceMotionUpdateInterval = intervalMs / 1000.0
  }

  public override func didStartListening(event: String) {
    guard event == EVENT_MAGNETOMETER_DID_UPDATE, !motionManager.isDeviceMotionActive else {
      return
    }
    let referenceFrame = getAttitudeReferenceFrame()

    motionManager.startDeviceMotionUpdates(using: referenceFrame, to: operationQueue) { [weak self] data, _ in
      guard let data else {
        return
      }
      let magneticField = data.magneticField.field
      self?.onMagnetometerUpdate(ThreeAxisSensorEvent(
        x: magneticField.x,
        y: magneticField.y,
        z: magneticField.z,
        timestamp: data.timestamp
      ))
    }
  }

  public override func didStopListening(event: String) {
    guard event == EVENT_MAGNETOMETER_DID_UPDATE else {
      return
    }
    motionManager.stopDeviceMotionUpdates()
  }

  public override func willDestroy() {
    motionManager.stopDeviceMotionUpdates()
  }
}
