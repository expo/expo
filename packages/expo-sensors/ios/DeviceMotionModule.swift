// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
private let GRAVITY = 9.80665

private let EVENT_DEVICE_MOTION_DID_UPDATE = "deviceMotionDidUpdate"

public final class DeviceMotionModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("ExponentDeviceMotion")

    Constants {
      return [
        "Gravity": GRAVITY
      ]
    }

    Events(EVENT_DEVICE_MOTION_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      return motionManager.isDeviceMotionAvailable
    }

    AsyncFunction("setUpdateInterval") { (intervalMs: Double) in
      motionManager.deviceMotionUpdateInterval = intervalMs / 1000.0
    }

    OnStartObserving {
      startDeviceMotionUpdates()
    }

    OnStopObserving {
      motionManager.stopDeviceMotionUpdates()
    }

    OnDestroy {
      motionManager.stopDeviceMotionUpdates()
    }
  }

  private func startDeviceMotionUpdates() {
    if motionManager.isDeviceMotionActive {
      return
    }
    let referenceFrame = getAttitudeReferenceFrame()

    motionManager.startDeviceMotionUpdates(using: referenceFrame, to: operationQueue) { [weak self] data, _ in
      guard let data, let self else {
        return
      }
      let userAcceleration = data.userAcceleration
      let attitude = data.attitude
      let rotationRate = data.rotationRate

      self.sendEvent(EVENT_DEVICE_MOTION_DID_UPDATE, [
        "acceleration": [
          "x": userAcceleration.x * GRAVITY,
          "y": userAcceleration.y * GRAVITY,
          "z": userAcceleration.z * GRAVITY,
          "timestamp": data.timestamp
        ],
        "accelerationIncludingGravity": [
          "x": (userAcceleration.x + data.gravity.x) * GRAVITY,
          "y": (userAcceleration.y + data.gravity.y) * GRAVITY,
          "z": (userAcceleration.z + data.gravity.z) * GRAVITY,
          "timestamp": data.timestamp
        ],
        "rotation": [
          "alpha": attitude.yaw,
          "beta": attitude.pitch,
          "gamma": attitude.roll,
          "timestamp": data.timestamp
        ],
        "rotationRate": [
          "alpha": radiansToDegrees(rotationRate.z),
          "beta": radiansToDegrees(rotationRate.y),
          "gamma": radiansToDegrees(rotationRate.x),
          "timestamp": data.timestamp
        ],
        "orientation": getDeviceOrientationRotation(),
        "interval": Double(self.motionManager.deviceMotionUpdateInterval)
      ])
    }
  }
}
