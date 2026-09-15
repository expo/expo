import CoreLocation
import ExpoModulesCore

struct LocationPermissionResponse {
  let status: EXPermissionStatus
  let scope: String
  let accuracy: String

  static let denied = LocationPermissionResponse(
    status: EXPermissionStatusDenied,
    scope: LocationAuthorizationScope.notGranted,
    accuracy: LocationAccuracyAuthorization.notGranted
  )

  static let undetermined = LocationPermissionResponse(
    status: EXPermissionStatusUndetermined,
    scope: LocationAuthorizationScope.notGranted,
    accuracy: LocationAccuracyAuthorization.notGranted
  )

  static func whenInUse(
    status: EXPermissionStatus = EXPermissionStatusGranted,
    accuracy: CLAccuracyAuthorization
  ) -> LocationPermissionResponse {
    return LocationPermissionResponse(
      status: status,
      scope: LocationAuthorizationScope.whenInUse,
      accuracy: LocationAccuracyAuthorization.from(accuracy)
    )
  }

  static func always(accuracy: CLAccuracyAuthorization) -> LocationPermissionResponse {
    return LocationPermissionResponse(
      status: EXPermissionStatusGranted,
      scope: LocationAuthorizationScope.always,
      accuracy: LocationAccuracyAuthorization.from(accuracy)
    )
  }

  var isUndetermined: Bool {
    return status == EXPermissionStatusUndetermined
  }

  func toDictionary() -> [AnyHashable: Any] {
    return [
      "status": status.rawValue,
      "scope": scope,
      "accuracy": accuracy
    ]
  }
}
