import CoreLocation

enum LocationAccuracyAuthorization {
  static let full = "full"
  static let reduced = "reduced"
  static let notGranted = "notGranted"

  static func from(_ accuracyAuthorization: CLAccuracyAuthorization) -> String {
    return accuracyAuthorization == .reducedAccuracy ? reduced : full
  }
}
