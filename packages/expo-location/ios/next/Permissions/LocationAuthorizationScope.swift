import CoreLocation

enum LocationAuthorizationScope: String {
  case whenInUse, always, notGranted

  static func from(_ systemStatus: CLAuthorizationStatus) -> LocationAuthorizationScope {
    switch systemStatus {
    case .authorizedWhenInUse:
      return .whenInUse
    case .authorizedAlways:
      return .always
    default:
      return .notGranted
    }
  }
}
