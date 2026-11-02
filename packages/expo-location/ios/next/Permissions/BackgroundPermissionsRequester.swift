import CoreLocation
import ExpoModulesCore

final class BackgroundPermissionsRequester: LocationPermissionsRequester {
  private var wasAsked = false

  private lazy var alwaysAuthorizationRequest = LocationManagerAlwaysAuthorizationRequest(locationManager: locationManager)

  init() {
    super.init(kind: .background)
  }

  override class func permissionType() -> String {
    return "locationBackgroundNext"
  }

  @MainActor
  override func requestFromSystem() async {
    do {
      try await alwaysAuthorizationRequest.request()
      wasAsked = true
      resolvePendingRequests()
    } catch {
      rejectPendingRequests(with: error)
    }
  }

  override func whenInUseResponse(accuracy: CLAccuracyAuthorization) -> LocationPermissionResponse {
    return LocationPermissionResponse.whenInUse(
      status: wasAsked ? EXPermissionStatusDenied : EXPermissionStatusUndetermined,
      accuracy: accuracy
    )
  }
}
