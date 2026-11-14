import CoreLocation
import UIKit

final class LocationManagerAlwaysAuthorizationRequest: NSObject, CLLocationManagerDelegate {
  private static let alwaysAuthorizationSelector = NSSelectorFromString(["request", "AlwaysAuthorization"].joined())
  private static let noDialogTimeout: Duration = .seconds(1.5)

  private let locationManager: CLLocationManager
  private var authorizationChanges: AsyncThrowingStream<Void, Error>.Continuation?
  private var beginStatus: CLAuthorizationStatus?

  init(locationManager: CLLocationManager) {
    self.locationManager = locationManager
    super.init()
    locationManager.delegate = self
  }

  @MainActor
  func request() async throws {
    let beginStatus = locationManager.authorizationStatus
    self.beginStatus = beginStatus
    if beginStatus == .authorizedWhenInUse {
      try await requestUpgradeFromWhenInUse()
    } else {
      try await requestFirstAuthorization()
    }
  }

  @MainActor
  private func requestFirstAuthorization() async throws {
    let authorizationChanges = makeAuthorizationChanges()
    defer {
      finishAuthorizationChanges()
    }

    locationManager.perform(Self.alwaysAuthorizationSelector)

    try await Self.waitForAuthorizationChange(authorizationChanges)
  }

  @MainActor
  private func requestUpgradeFromWhenInUse() async throws {
    await Self.waitForAppToBecomeActive()

    let authorizationChanges = makeAuthorizationChanges()
    defer {
      finishAuthorizationChanges()
    }
    let appWillResignActive = NotificationCenter.default.notifications(named: UIApplication.willResignActiveNotification)
    let appDidBecomeActive = NotificationCenter.default.notifications(named: UIApplication.didBecomeActiveNotification)

    try await withThrowingTaskGroup(of: Void.self) { group in
      group.addTask {
        try await Self.waitForAuthorizationChange(authorizationChanges)
      }
      group.addTask { @MainActor in
        await Self.waitForDialogToCloseWithoutChange(
          appWillResignActive: appWillResignActive,
          appDidBecomeActive: appDidBecomeActive
        )
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

  private func finishAuthorizationChanges() {
    authorizationChanges?.finish()
    authorizationChanges = nil
  }

  private static func waitForAuthorizationChange(_ changes: AsyncThrowingStream<Void, Error>) async throws {
    for try await _ in changes {
      return
    }
  }

  @MainActor
  private static func waitForAppToBecomeActive() async {
    guard UIApplication.shared.applicationState != .active else {
      return
    }
    for await _ in NotificationCenter.default.notifications(named: UIApplication.didBecomeActiveNotification) {
      return
    }
  }

  @MainActor
  private static func waitForDialogToCloseWithoutChange(
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
    guard manager.authorizationStatus != beginStatus else {
      return
    }
    authorizationChanges?.yield(())
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    authorizationChanges?.finish(throwing: error)
  }
}
