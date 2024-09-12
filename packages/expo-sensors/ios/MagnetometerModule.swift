// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

private let EVENT_MAGNETOMETER_DID_UPDATE = "magnetometerDidUpdate"

public final class MagnetometerModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("ExponentMagnetometer")

    Events(EVENT_MAGNETOMETER_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      return motionManager.isDeviceMotionAvailable
    }

    AsyncFunction("setUpdateInterval") { (intervalMs: Double) in
      motionManager.deviceMotionUpdateInterval = intervalMs / 1000.0
    }

    OnStartObserving {
      if motionManager.isDeviceMotionActive {
        return
      }
      let referenceFrame = getAttitudeReferenceFrame()

      motionManager.startDeviceMotionUpdates(using: referenceFrame, to: operationQueue) { [weak self] data, _ in
        guard let magneticField = data?.magneticField.field, let timestamp = data?.timestamp else {
          return
        }
        self?.sendEvent(EVENT_MAGNETOMETER_DID_UPDATE, [
          "x": magneticField.x,
          "y": magneticField.y,
          "z": magneticField.z,
          "timestamp": timestamp
        ])
      }
    }

    OnStopObserving {
      motionManager.stopDeviceMotionUpdates()
    }

    OnDestroy {
      motionManager.stopDeviceMotionUpdates()
    }
  }
}
