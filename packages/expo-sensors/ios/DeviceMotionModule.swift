// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
private let GRAVITY = 9.80665

// `@Event` needs a string literal, so it repeats this name.
private let EVENT_DEVICE_MOTION_DID_UPDATE = "deviceMotionDidUpdate"

@ExpoModule("ExponentDeviceMotion")
public final class DeviceMotionModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  @Event("deviceMotionDidUpdate")
  var onDeviceMotionUpdate: (DeviceMotionEvent) -> Void

  @JS("Gravity")
  lazy var gravity = GRAVITY

  @JS
  func isAvailableAsync() async -> Bool {
    return motionManager.isDeviceMotionAvailable
  }

  @JS
  func setUpdateInterval(intervalMs: Double) async {
    motionManager.deviceMotionUpdateInterval = intervalMs / 1000.0
  }

  @JS
  func getPermissionsAsync() async throws -> [String: Any] {
    return try await MotionPermissionRequester.getPermissionsAsync(appContext: appContext)
  }

  @JS
  func requestPermissionsAsync() async throws -> [String: Any] {
    return try await MotionPermissionRequester.requestPermissionsAsync(appContext: appContext)
  }

  public override func didCreate() {
    appContext?.permissions?.register([MotionPermissionRequester()])
  }

  public override func didStartListening(event: String) {
    guard event == EVENT_DEVICE_MOTION_DID_UPDATE else {
      return
    }
    startDeviceMotionUpdates()
  }

  public override func didStopListening(event: String) {
    guard event == EVENT_DEVICE_MOTION_DID_UPDATE else {
      return
    }
    motionManager.stopDeviceMotionUpdates()
  }

  public override func willDestroy() {
    motionManager.stopDeviceMotionUpdates()
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

      self.onDeviceMotionUpdate(DeviceMotionEvent(
        acceleration: ThreeAxisSensorEvent(
          x: userAcceleration.x * GRAVITY,
          y: userAcceleration.y * GRAVITY,
          z: userAcceleration.z * GRAVITY,
          timestamp: data.timestamp
        ),
        accelerationIncludingGravity: ThreeAxisSensorEvent(
          x: (userAcceleration.x + data.gravity.x) * GRAVITY,
          y: (userAcceleration.y + data.gravity.y) * GRAVITY,
          z: (userAcceleration.z + data.gravity.z) * GRAVITY,
          timestamp: data.timestamp
        ),
        rotation: RotationEvent(
          alpha: attitude.yaw,
          beta: attitude.pitch,
          gamma: attitude.roll,
          timestamp: data.timestamp
        ),
        rotationRate: RotationEvent(
          alpha: radiansToDegrees(rotationRate.z),
          beta: radiansToDegrees(rotationRate.y),
          gamma: radiansToDegrees(rotationRate.x),
          timestamp: data.timestamp
        ),
        orientation: getDeviceOrientationRotation(),
        interval: Double(self.motionManager.deviceMotionUpdateInterval)
      ))
    }
  }
}
