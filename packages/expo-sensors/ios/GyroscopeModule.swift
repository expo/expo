// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// `@Event` needs a string literal, so it repeats this name.
private let EVENT_GYROSCOPE_DID_UPDATE = "gyroscopeDidUpdate"

@ExpoModule("ExponentGyroscope")
public final class GyroscopeModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  @Event("gyroscopeDidUpdate")
  var onGyroscopeUpdate: (ThreeAxisSensorEvent) -> Void

  @JS
  func isAvailableAsync() async -> Bool {
    return motionManager.isGyroAvailable
  }

  @JS
  func setUpdateInterval(intervalMs: Double) async {
    motionManager.gyroUpdateInterval = intervalMs / 1000.0
  }

  public override func didStartListening(event: String) {
    guard event == EVENT_GYROSCOPE_DID_UPDATE, !motionManager.isGyroActive else {
      return
    }
    motionManager.startGyroUpdates(to: operationQueue) { [weak self] data, _ in
      guard let data else {
        return
      }
      self?.onGyroscopeUpdate(ThreeAxisSensorEvent(
        x: data.rotationRate.x,
        y: data.rotationRate.y,
        z: data.rotationRate.z,
        timestamp: data.timestamp
      ))
    }
  }

  public override func didStopListening(event: String) {
    guard event == EVENT_GYROSCOPE_DID_UPDATE else {
      return
    }
    motionManager.stopGyroUpdates()
  }

  public override func willDestroy() {
    motionManager.stopGyroUpdates()
  }
}
