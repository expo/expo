import CoreLocation

final class PositionUpdatesCompatibilitySource: NSObject, CLLocationManagerDelegate {
  private lazy var manager = CLLocationManager()
  private var continuation: AsyncThrowingStream<CLLocation?, Error>.Continuation?

  func updates(for profile: Profile, allowsBackgroundUpdates: Bool = false) -> PositionUpdatesSource {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    self.continuation = continuation
    guard CLLocationManager.locationServicesEnabled() else {
      continuation.finish(throwing: LocationServicesDisabledGlobally())
      return PositionUpdatesSource(stream: stream, continuation: continuation) {}
    }
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
    case CLError.denied where manager.authorizationStatus == .authorizedWhenInUse:
      // iOS sends this to a whenInUse app while it is in the background. The permission is intact and
      // updates resume on their own once the app is back in the foreground.
      return
    case CLError.denied:
      continuation?.finish(throwing: LocationAuthorizationDenied())
    default:
      continuation?.finish(throwing: error)
    }
  }
}
