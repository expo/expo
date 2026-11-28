// Copyright 2024-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoLocation

final class CoreMotionActivityProvider: MotionActivityProvider {
  var isActivityAvailable: Bool {
    CMMotionActivityManager.isActivityAvailable()
  }

  var authorization: MotionActivityAuthorization {
    switch CMMotionActivityManager.authorizationStatus() {
    case .authorized:
      return .authorized
    case .denied, .restricted:
      return .deniedOrRestricted
    case .notDetermined:
      return .notDetermined
    @unknown default:
      return .notDetermined
    }
  }

  func requestAuthorization(completion: @escaping () -> Void) {
    // Issuing a short historical query is the standard way to trigger the system
    // Motion and Fitness permission prompt when the status is .notDetermined.
    // Each request owns its manager, so overlapping requests cannot release each other's.
    let manager = CMMotionActivityManager()
    manager.queryActivityStarting(from: Date(timeIntervalSinceNow: -1), to: Date(), to: .main) { _, _ in
      withExtendedLifetime(manager) {
        completion()
      }
    }
  }

  func watchActivity(
    onActivity: @escaping ([String: Any]) -> Void,
    onUnauthorized: @escaping () -> Void
  ) -> MotionActivityWatch {
    CoreMotionActivityWatch(onActivity: onActivity, onUnauthorized: onUnauthorized)
  }
}

private final class CoreMotionActivityWatch: MotionActivityWatch {
  private let manager = CMMotionActivityManager()

  init(onActivity: @escaping ([String: Any]) -> Void, onUnauthorized: @escaping () -> Void) {
    manager.startActivityUpdates(to: .main) { [weak self] activity in
      if let activity {
        onActivity(activity.toMotionActivityDict())
        return
      }
      // A nil update with .notDetermined or .authorized is a transient gap.
      let status = CMMotionActivityManager.authorizationStatus()
      if status == .denied || status == .restricted {
        self?.stop()
        onUnauthorized()
      }
    }
  }

  deinit {
    stop()
  }

  func stop() {
    manager.stopActivityUpdates()
  }
}
