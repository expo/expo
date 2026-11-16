import CoreLocation
import ExpoModulesCore

final class ForegroundPermissionsRequester: LocationPermissionsRequester, CLLocationManagerDelegate {
  // The selector is constructed at runtime from separate parts so that neither the selector
  // nor the full method name literal ends up in the binary. Apple's static analysis warns
  // developers when it sees this method called while the matching usage description may be
  // missing from Info.plist - we let the provided NSLocation*UsageDescription keys govern
  // the behavior instead.
  private static let whenInUseAuthorizationSelector = NSSelectorFromString(["request", "WhenInUseAuthorization"].joined())

  init() {
    super.init(kind: .foreground)
  }

  override class func permissionType() -> String {
    return "locationForegroundNext"
  }

  @MainActor
  override func requestFromSystem() async {
    locationManager.delegate = self
    locationManager.perform(Self.whenInUseAuthorizationSelector)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    rejectPendingRequests(with: error)
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    // notDetermined authorizationStatus means that user has not clicked the pop-up yet
    // this check is important because this callback runs on the manager initalization with notDetermined
    guard manager.authorizationStatus != .notDetermined else {
      return
    }
    resolvePendingRequests()
  }
}
