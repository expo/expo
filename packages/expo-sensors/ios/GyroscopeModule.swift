// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

private let EVENT_GYROSCOPE_DID_UPDATE = "gyroscopeDidUpdate"

public final class GyroscopeModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("ExponentGyroscope")

    Events(EVENT_GYROSCOPE_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      return motionManager.isGyroAvailable
    }

    AsyncFunction("setUpdateInterval") { (intervalMs: Double) in
      motionManager.gyroUpdateInterval = intervalMs / 1000.0
    }

    OnStartObserving {
      if motionManager.isGyroActive {
        return
      }
      motionManager.startGyroUpdates(to: operationQueue) { [weak self] data, _ in
        guard let rotationRate = data?.rotationRate, let timestamp = data?.timestamp else {
          return
        }
        self?.sendEvent(EVENT_GYROSCOPE_DID_UPDATE, [
          "x": rotationRate.x,
          "y": rotationRate.y,
          "z": rotationRate.z,
          "timestamp": timestamp
        ])
      }
    }

    OnStopObserving {
      motionManager.stopGyroUpdates()
    }

    OnDestroy {
      motionManager.stopGyroUpdates()
    }
  }
}
