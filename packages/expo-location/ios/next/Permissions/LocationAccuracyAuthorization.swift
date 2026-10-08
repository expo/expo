import CoreLocation

enum LocationAccuracyAuthorization: String {
  case full, reduced, notGranted

  static func from(_ accuracyAuthorization: CLAccuracyAuthorization) -> LocationAccuracyAuthorization {
    return accuracyAuthorization == .reducedAccuracy ? .reduced : .full
  }
}
