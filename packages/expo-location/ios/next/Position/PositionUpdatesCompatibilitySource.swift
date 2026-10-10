import CoreLocation

final class PositionUpdatesCompatibilitySource: NSObject, CLLocationManagerDelegate {
  var makeManager: () -> CLLocationManager = { CLLocationManager() }
  var isLocationServicesEnabled: () -> Bool = CLLocationManager.locationServicesEnabled
  private lazy var manager = makeManager()
  private var continuation: AsyncThrowingStream<CLLocation?, Error>.Continuation?

  func updates(for profile: Profile, allowsBackgroundUpdates: Bool = false) -> PositionUpdatesSource {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    self.continuation = continuation
    DispatchQueue.main.async {
      self.manager.delegate = self
      self.manager.activityType = profile.clActivityType()
      self.manager.distanceFilter = profile.clDistanceFilter()
      self.manager.desiredAccuracy = profile.clDesiredAccuracy()
      self.manager.allowsBackgroundLocationUpdates = allowsBackgroundUpdates
      self.manager.startUpdatingLocation()
    }
    return PositionUpdatesSource(stream: stream, continuation: continuation) {
      DispatchQueue.main.async {
        self.manager.stopUpdatingLocation()
        self.manager.delegate = nil
        self.continuation = nil
      }
    }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    for location in locations {
      continuation?.yield(location)
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    switch error {
    case CLError.locationUnknown:
      return
    case CLError.denied where !isLocationServicesEnabled():
      continuation?.finish(throwing: LocationServicesDisabledGlobally())
    case CLError.denied where manager.authorizationStatus == .authorizedWhenInUse:
      // The system sends CLError.denied when an app with whenInUse permission moves to the background.
      // Updates resume on their own once the app returns to the foreground, so this error is ignored.
      return
    case CLError.denied:
      continuation?.finish(throwing: LocationAuthorizationDenied())
    default:
      continuation?.finish(throwing: error)
    }
  }
}
