import CoreLocation
import UIKit

final class LocationManagerAlwaysAuthorizationRequest: NSObject, CLLocationManagerDelegate {
  private static let alwaysAuthorizationSelector = NSSelectorFromString(["request", "AlwaysAuthorization"].joined())
  private static let noDialogTimeout: Duration = .seconds(1.5)

  private let locationManager: CLLocationManager
  private var authorizationChanges: AsyncThrowingStream<Void, Error>.Continuation?

  init(locationManager: CLLocationManager) {
    self.locationManager = locationManager
    super.init()
    locationManager.delegate = self
  }

  @MainActor
  func request() async throws {
    let authorizationChanges = makeAuthorizationChanges()
    let appWillResignActive = NotificationCenter.default.notifications(named: UIApplication.willResignActiveNotification)
    let appDidBecomeActive = NotificationCenter.default.notifications(named: UIApplication.didBecomeActiveNotification)
    let isUpgradeFromWhenInUse = locationManager.authorizationStatus == .authorizedWhenInUse

    try await withThrowingTaskGroup(of: Void.self) { group in
      group.addTask {
        try await Self.waitForAuthorizationChange(authorizationChanges)
      }

      if isUpgradeFromWhenInUse {
        group.addTask { @MainActor in
          await Self.waitForDialogToClose(
            appWillResignActive: appWillResignActive,
            appDidBecomeActive: appDidBecomeActive
          )
        }
      }

      locationManager.perform(Self.alwaysAuthorizationSelector)

      try await group.next()
      group.cancelAll()
    }
  }

  private func makeAuthorizationChanges() -> AsyncThrowingStream<Void, Error> {
    return AsyncThrowingStream { continuation in
      self.authorizationChanges = continuation
    }
  }

  private static func waitForAuthorizationChange(_ changes: AsyncThrowingStream<Void, Error>) async throws {
    for try await _ in changes {
      return
    }
  }

  @MainActor
  private static func waitForDialogToClose(
    appWillResignActive: NotificationCenter.Notifications,
    appDidBecomeActive: NotificationCenter.Notifications
  ) async {
    let dialogDidOpen = await receivedNotification(from: appWillResignActive, within: noDialogTimeout)
    guard dialogDidOpen else {
      return
    }
    for await _ in appDidBecomeActive {
      return
    }
  }

  private static func receivedNotification(
    from notifications: NotificationCenter.Notifications,
    within timeout: Duration
  ) async -> Bool {
    return await withTaskGroup(of: Bool.self) { group in
      group.addTask {
        for await _ in notifications {
          return true
        }
        return false
      }
      group.addTask {
        try? await Task.sleep(for: timeout)
        return false
      }
      let firstResult = await group.next() ?? false
      group.cancelAll()
      return firstResult
    }
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    guard manager.authorizationStatus != .notDetermined else {
      return
    }
    authorizationChanges?.yield(())
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    authorizationChanges?.finish(throwing: error)
  }
}
