import CoreLocation

final class WhenInUseAuthorizationCompatibilitySource: NSObject, LocationAuthorizationSource, CLLocationManagerDelegate {
  // Construct the selector at runtime so Apple's static analysis leaves usage-description
  // validation to the requester, which checks the app's Info.plist before calling this source.
  private static let whenInUseAuthorizationSelector = NSSelectorFromString(["request", "WhenInUseAuthorization"].joined())

  private let locationManager: CLLocationManager
  private var continuation: CheckedContinuation<Void, Error>?

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
      locationManager.perform(Self.whenInUseAuthorizationSelector)
    }
  }

  private func finish(throwing error: Error? = nil) {
    guard let continuation else {
      return
    }
    self.continuation = nil
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
    // The initial callback is not an answer to the permission request.
    guard manager.authorizationStatus != .notDetermined else {
      return
    }
    finish()
  }
}
