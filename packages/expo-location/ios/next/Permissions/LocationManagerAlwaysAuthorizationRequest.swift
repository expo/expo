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
    defer {
      finishAuthorizationChanges()
    }
    if beginStatus == .authorizedWhenInUse {
      try await requestUpgradeFromWhenInUse()
    } else {
      try await requestFirstAuthorization()
    }
  }

  @MainActor
  private func requestFirstAuthorization() async throws {
    let authorizationChanges = sendAlwaysAuthorizationRequest()
    try await authorizationChanges.waitForNext()
  }

  @MainActor
  private func requestUpgradeFromWhenInUse() async throws {
    await Self.waitForAppToBecomeActive()

    let appWillResignActive = NotificationCenter.default.notifications(named: UIApplication.willResignActiveNotification)
    let appDidBecomeActive = NotificationCenter.default.notifications(named: UIApplication.didBecomeActiveNotification)
    let authorizationChanges = sendAlwaysAuthorizationRequest()

    try await withThrowingTaskGroup(of: Void.self) { group in
      group.addTask {
        try await authorizationChanges.waitForNext()
      }
      group.addTask { @MainActor in
        await Self.waitForDialogToCloseWithoutChange(
          appWillResignActive: appWillResignActive,
          appDidBecomeActive: appDidBecomeActive
        )
      }

      try await group.next()
      group.cancelAll()
    }
  }

  @MainActor
  private func sendAlwaysAuthorizationRequest() -> AsyncThrowingStream<Void, Error> {
    let authorizationChanges = AsyncThrowingStream<Void, Error> { continuation in
      self.authorizationChanges = continuation
    }
    locationManager.perform(Self.alwaysAuthorizationSelector)
    return authorizationChanges
  }

  private func finishAuthorizationChanges() {
    authorizationChanges?.finish()
    authorizationChanges = nil
  }

  @MainActor
  private static func waitForAppToBecomeActive() async {
    guard UIApplication.shared.applicationState != .active else {
      return
    }
    await NotificationCenter.default.notifications(named: UIApplication.didBecomeActiveNotification).waitForNext()
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
    await appDidBecomeActive.waitForNext()
  }

  private static func receivedNotification(
    from notifications: NotificationCenter.Notifications,
    within timeout: Duration
  ) async -> Bool {
    return await withTaskGroup(of: Bool.self) { group in
      group.addTask {
        await notifications.waitForNext()
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

private extension AsyncSequence {
  @discardableResult
  func waitForNext() async rethrows -> Bool {
    for try await _ in self {
      return true
    }
    return false
  }
}
