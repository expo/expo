// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

private let EVENT_ACCELEROMETER_DID_UPDATE = "accelerometerDidUpdate"

public final class AccelerometerModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("ExponentAccelerometer")

    Events(EVENT_ACCELEROMETER_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      return motionManager.isAccelerometerAvailable
    }

    AsyncFunction("setUpdateInterval") { (intervalMs: Double) in
      motionManager.accelerometerUpdateInterval = intervalMs / 1000.0
    }

    OnStartObserving {
      if motionManager.isAccelerometerActive {
        return
      }
      motionManager.startAccelerometerUpdates(to: operationQueue) { [weak self] data, _ in
        guard let acceleration = data?.acceleration, let timestamp = data?.timestamp else {
          return
        }
        self?.sendEvent(EVENT_ACCELEROMETER_DID_UPDATE, [
          "x": acceleration.x,
          "y": acceleration.y,
          "z": acceleration.z,
          "timestamp": timestamp
        ])
      }
    }

    OnStopObserving {
      motionManager.stopAccelerometerUpdates()
    }

    OnDestroy {
      motionManager.stopAccelerometerUpdates()
    }
  }
}
