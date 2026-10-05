import CoreLocation
import ExpoModulesCore

struct LocationPermissionResponse {
  let status: EXPermissionStatus
  let scope: LocationAuthorizationScope
  let accuracy: LocationAccuracyAuthorization

  static let denied = LocationPermissionResponse(
    status: EXPermissionStatusDenied,
    scope: .notGranted,
    accuracy: .notGranted
  )

  static let undetermined = LocationPermissionResponse(
    status: EXPermissionStatusUndetermined,
    scope: .notGranted,
    accuracy: .notGranted
  )

  static func whenInUse(
    status: EXPermissionStatus = EXPermissionStatusGranted,
    accuracy: CLAccuracyAuthorization
  ) -> LocationPermissionResponse {
    return LocationPermissionResponse(
      status: status,
      scope: .whenInUse,
      accuracy: .from(accuracy)
    )
  }

  static func always(accuracy: CLAccuracyAuthorization) -> LocationPermissionResponse {
    return LocationPermissionResponse(
      status: EXPermissionStatusGranted,
      scope: .always,
      accuracy: .from(accuracy)
    )
  }

  var isUndetermined: Bool {
    return status == EXPermissionStatusUndetermined
  }

  func toDictionary() -> [AnyHashable: Any] {
    return [
      "status": status.rawValue,
      "scope": scope.rawValue,
      "accuracy": accuracy.rawValue
    ]
  }
}
