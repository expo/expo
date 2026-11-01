// Copyright 2021-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

public final class MotionPermissionRequester: NSObject, EXPermissionsRequester {
  private let infoDictionaryValue: (String) -> Any?
  private let authorizationStatus: () -> CMAuthorizationStatus

  init(
    infoDictionaryValue: @escaping (String) -> Any?,
    authorizationStatus: @escaping () -> CMAuthorizationStatus
  ) {
    self.infoDictionaryValue = infoDictionaryValue
    self.authorizationStatus = authorizationStatus
  }

  public override convenience init() {
    self.init(
      infoDictionaryValue: Bundle.main.object(forInfoDictionaryKey:),
      authorizationStatus: CMPedometer.authorizationStatus
    )
  }

  public static func permissionType() -> String {
    return "motion"
  }

  // The compile define comes from the `MOTION_PERMISSION` Podfile property. Precompiled and
  // SwiftPM builds cannot receive a per-app define, so the config plugin also writes this key.
  static func isMotionPermissionDisabled(
    infoDictionaryValue: (String) -> Any? = Bundle.main.object(forInfoDictionaryKey:)
  ) -> Bool {
    #if EXPO_DISABLE_MOTION_PERMISSION
    return true
    #else
    return infoDictionaryValue("ExpoSensors_disableMotionPermission") as? Bool == true
    #endif
  }

  private var motionUsageDescription: Any? {
    infoDictionaryValue("NSMotionUsageDescription")
  }

  public func getPermissions() -> [AnyHashable: Any] {
    if Self.isMotionPermissionDisabled(infoDictionaryValue: infoDictionaryValue) {
      return ["status": EXPermissionStatusDenied.rawValue]
    }
    return Self.permissions(authorizationStatus: authorizationStatus(), usageDescription: motionUsageDescription)
  }

  // `authorizationStatus` is an autoclosure because touching CMPedometer without the usage
  // description makes iOS terminate the app.
  static func permissions(
    authorizationStatus: @autoclosure () -> CMAuthorizationStatus,
    usageDescription: Any?
  ) -> [AnyHashable: Any] {
    guard usageDescription != nil else {
      log.error("""
        This app is missing NSMotionUsageDescription in its Info.plist. iOS terminates an app that \
        accesses motion data without this key, so the motion permission is reported as denied. Add \
        the key to the app's Info.plist, or set the `motionPermission` option of the expo-sensors \
        config plugin.
        """)
      return ["status": EXPermissionStatusDenied.rawValue]
    }

    let status: EXPermissionStatus
    switch authorizationStatus() {
    case .authorized:
      status = EXPermissionStatusGranted
    case .denied, .restricted:
      status = EXPermissionStatusDenied
    case .notDetermined:
      status = EXPermissionStatusUndetermined
    @unknown default:
      status = EXPermissionStatusUndetermined
    }
    return ["status": status.rawValue]
  }

  public func requestPermissions(
    resolver resolve: @escaping EXPromiseResolveBlock,
    rejecter reject: @escaping EXPromiseRejectBlock
  ) {
    if Self.isMotionPermissionDisabled(infoDictionaryValue: infoDictionaryValue) {
      resolve(getPermissions())
      return
    }
    requestPermissions(usageDescription: motionUsageDescription, resolver: resolve, rejecter: reject)
  }

  func requestPermissions(
    usageDescription: Any?,
    resolver resolve: @escaping EXPromiseResolveBlock,
    rejecter reject: @escaping EXPromiseRejectBlock
  ) {
    guard usageDescription != nil else {
      resolve(Self.permissions(authorizationStatus: authorizationStatus(), usageDescription: nil))
      return
    }

    // CoreMotion has no explicit request API; the first pedometer query shows the system prompt.
    let pedometer = CMPedometer()
    let now = Date()
    pedometer.queryPedometerData(from: now, to: now) { _, _ in
      pedometer.stopUpdates()
      resolve(self.getPermissions())
    }
  }
}
