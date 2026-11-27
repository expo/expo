// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore

public enum MotionActivityAuthorization {
  case notDetermined
  case authorized
  case deniedOrRestricted
}

/// A running motion activity watch. The watch also stops when it is deallocated.
public protocol MotionActivityWatch: AnyObject {
  func stop()
}

/// The CoreMotion side of motion activity. The `ExpoLocationMotionActivity` companion implements
/// it, so that `ExpoLocation` does not link CoreMotion.
public protocol MotionActivityProvider: AnyObject {
  var isActivityAvailable: Bool { get }
  var authorization: MotionActivityAuthorization { get }

  /// Shows the system permission prompt when the authorization is not determined.
  /// Calls `completion` on the main queue when the user answers.
  func requestAuthorization(completion: @escaping () -> Void)

  /// Calls `onActivity` on the main queue for each reading. Calls `onUnauthorized` and stops
  /// when the user revokes access.
  func watchActivity(
    onActivity: @escaping ([String: Any]) -> Void,
    onUnauthorized: @escaping () -> Void
  ) -> MotionActivityWatch
}

public enum MotionActivityRegistry {
  /// Set by the `ExpoLocationMotionActivity` companion when its image loads;
  /// `nil` when the app does not link the companion.
  public static var provider: MotionActivityProvider?

  // A lazily initialized `static let` runs once, even when module instances start on several threads.
  private static let companionCheck: Void = {
    let motionActivityEnabled = Bundle.main.object(forInfoDictionaryKey: "ExpoLocation_motionActivityEnabled")
    if MotionActivityRegistry.shouldWarnThatCompanionIsMissing(motionActivityEnabled: motionActivityEnabled) {
      log.warn(
        "expo-location: motion activity is enabled, but the app does not include ExpoLocationMotionActivity " +
          "(a CocoaPods pod or SwiftPM product), so the motion activity methods throw an error. " +
          "Run 'npx expo prebuild', then rebuild the app. " +
          "If you do not use motion activity, set 'motionUsagePermission' to false in the expo-location config plugin."
      )
    }
  }()

  static func authorizedProvider() throws -> MotionActivityProvider {
    guard let provider else {
      throw Exceptions.MotionActivityCompanionMissing()
    }
    guard provider.isActivityAvailable else {
      throw Exceptions.MotionActivityUnavailable()
    }
    guard provider.authorization != .deniedOrRestricted else {
      throw Exceptions.MotionActivityUnauthorized()
    }
    return provider
  }

  static func warnOnceIfCompanionIsMissing() {
    _ = companionCheck
  }

  /// Only an explicit `true` warns: an app built without the config plugin's Info.plist key may
  /// have left the companion out on purpose.
  static func shouldWarnThatCompanionIsMissing(motionActivityEnabled: Any?) -> Bool {
    // `as? Bool` also matches an `<integer>` of 0 or 1, which the config plugin never writes.
    guard let number = motionActivityEnabled as? NSNumber, CFGetTypeID(number) == CFBooleanGetTypeID() else {
      return false
    }
    return number.boolValue && provider == nil
  }
}
