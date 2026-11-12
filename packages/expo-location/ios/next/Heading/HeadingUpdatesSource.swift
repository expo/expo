import CoreLocation

final class HeadingUpdatesSource: NSObject, CLLocationManagerDelegate {
  var onHeading: (Heading) -> Void = { _ in }
  var onError: (Error) -> Void = { _ in }
  private var manager: CLLocationManager?

  func start(filter: CLLocationDegrees?) {
    stop()
    let manager = CLLocationManager()
    self.manager = manager
    if let filter {
      manager.headingFilter = filter > 0 ? filter : kCLHeadingFilterNone
    }
    manager.delegate = self
    manager.startUpdatingHeading()
  }

  func stop() {
    manager?.stopUpdatingHeading()
    manager?.stopUpdatingLocation()
    manager?.delegate = nil
    manager = nil
  }

  private func isAuthorizedForLocation(_ manager: CLLocationManager) -> Bool {
    switch manager.authorizationStatus {
    case .authorizedWhenInUse, .authorizedAlways:
      return true
    default:
      return false
    }
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    guard manager === self.manager, isAuthorizedForLocation(manager) else {
      return
    }
    manager.desiredAccuracy = kCLLocationAccuracyThreeKilometers
    manager.startUpdatingLocation()
  }

  func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
    onHeading(newHeading.toHeading())
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    switch error {
    case CLError.headingFailure:
      onError(HeadingUpdatesFailed())
    default:
      return
    }
  }
}
