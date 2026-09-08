import CoreLocation
import ExpoModulesCore

struct LocationUpdateDiagnostics {
  let authorizationDenied: Bool
  let authorizationDeniedGlobally: Bool
  let authorizationRestricted: Bool
  let serviceSessionRequired: Bool
  let insufficientlyInUse: Bool
  let locationUnavailable: Bool

  func unrecoverableFailure() -> Exception? {
    if authorizationRestricted {
      return LocationAuthorizationRestricted()
    }
    if authorizationDeniedGlobally {
      return LocationServicesDisabledGlobally()
    }
    if authorizationDenied {
      return LocationAuthorizationDenied()
    }
    if serviceSessionRequired {
      return LocationServiceSessionRequired()
    }
    return nil
  }
}

@available(iOS 18.0, *)
extension LocationUpdateDiagnostics {
  init(_ update: CLLocationUpdate) {
    self.init(
      authorizationDenied: update.authorizationDenied,
      authorizationDeniedGlobally: update.authorizationDeniedGlobally,
      authorizationRestricted: update.authorizationRestricted,
      serviceSessionRequired: update.serviceSessionRequired,
      insufficientlyInUse: update.insufficientlyInUse,
      locationUnavailable: update.locationUnavailable
    )
  }
}
