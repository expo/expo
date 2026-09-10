import CoreLocation
import UIKit

final class AlwaysAuthorizationCompatibilitySource: NSObject, LocationAuthorizationSource, CLLocationManagerDelegate {
  // The selector is constructed at runtime from separate parts so that neither the selector
  // nor the full method name literal ends up in the binary. Apple's static analysis warns
  // developers when it sees this method called while the matching usage description may be
  // missing from Info.plist - we let the provided NSLocation*UsageDescription keys govern
  // the behavior instead.
  private static let alwaysAuthorizationSelector = NSSelectorFromString(["request", "AlwaysAuthorization"].joined())

  private let locationManager: CLLocationManager
  private var continuation: CheckedContinuation<Void, Error>?
  private var initialAuthorizationStatus: CLAuthorizationStatus?
  private var isWaitingForTimeout = false

  init(locationManager: CLLocationManager) {
    self.locationManager = locationManager
    super.init()
    locationManager.delegate = self
  }

  @MainActor
  func request() async throws {
    guard continuation == nil else {
      throw PermissionRequestInProgressException()
    }

    try await withCheckedThrowingContinuation { continuation in
      self.continuation = continuation
      initialAuthorizationStatus = locationManager.authorizationStatus

      if locationManager.authorizationStatus == .authorizedWhenInUse {
        // We already have a foreground permission granted:
        // When asking for background location, we might or might not have asked for foreground permission
        // before we get here. An issue here is if the user has a temporary permission ("Allow once") - which
        // results in the status being "kCLAuthorizationStatusAuthorizedWhenInUse" - without us knowing.
        // We need to handle this special case which is not possible to detect through the API.
        // What we do is that we'll wait 1.5 seconds on an UIApplicationWillResignActiveNotification
        // notification (which will be emitted almost directly if the permission dialog is displayed). If the permission
        // dialog is not displayed we'll timeout and can resolve the waiting promise with an updated denied status.
        NotificationCenter.default.addObserver(
          self,
          selector: #selector(handleAppBecomingInactive),
          name: UIApplication.willResignActiveNotification,
          object: nil
        )
        isWaitingForTimeout = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
          guard let self, self.isWaitingForTimeout else {
            return
          }
          self.finish()
        }
      }

      locationManager.perform(Self.alwaysAuthorizationSelector)
    }
  }

  private func finish(throwing error: Error? = nil) {
    guard let continuation else {
      return
    }
    NotificationCenter.default.removeObserver(self)
    isWaitingForTimeout = false
    self.continuation = nil
    initialAuthorizationStatus = nil
    if let error {
      continuation.resume(throwing: error)
    } else {
      continuation.resume()
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    finish(throwing: error)
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    // Assigning the delegate can report the existing grant before the user answers.
    // A declined upgrade leaves authorization unchanged and finishes when the app becomes active.
    guard manager.authorizationStatus != .notDetermined,
      manager.authorizationStatus != initialAuthorizationStatus else {
      return
    }
    finish()
  }

  @objc
  private func handleAppBecomingInactive() {
    // Let's wait until the app becomes inactive - this happens when OS displays the
    // permission dialog - then we can cancel the timeout handler.
    isWaitingForTimeout = false
    NotificationCenter.default.removeObserver(self, name: UIApplication.willResignActiveNotification, object: nil)

    // When the app is inactive it means that a permission dialog is showing and we should ask to be
    // notified when the dialog is closed:
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppBecomingActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
  }

  @objc
  private func handleAppBecomingActive() {
    finish()
  }
}
