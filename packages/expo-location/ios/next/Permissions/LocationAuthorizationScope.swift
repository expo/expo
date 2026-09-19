import CoreLocation

enum LocationAuthorizationScope {
  static let whenInUse = "whenInUse"
  static let always = "always"
  static let notGranted = "notGranted"

  static func from(_ systemStatus: CLAuthorizationStatus) -> String {
    switch systemStatus {
    case .authorizedWhenInUse:
      return whenInUse
    case .authorizedAlways:
      return always
    default:
      return notGranted
    }
  }
}
