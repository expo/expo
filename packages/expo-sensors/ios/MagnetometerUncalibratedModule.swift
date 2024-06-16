// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

private let EVENT_MAGNETOMETER_DID_UPDATE = "magnetometerUncalibratedDidUpdate"

public final class MagnetometerUncalibratedModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("ExponentMagnetometerUncalibrated")

    Events(EVENT_MAGNETOMETER_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      return motionManager.isMagnetometerAvailable
    }

    AsyncFunction("setUpdateInterval") { (intervalMs: Double) in
      motionManager.magnetometerUpdateInterval = intervalMs
    }

    OnStartObserving {
      if motionManager.isMagnetometerActive {
        return
      }
      motionManager.startMagnetometerUpdates(to: operationQueue) { [weak self] data, _ in
        guard let magneticField = data?.magneticField, let timestamp = data?.timestamp else {
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
      motionManager.stopMagnetometerUpdates()
    }

    OnDestroy {
      motionManager.stopMagnetometerUpdates()
    }
  }
}
