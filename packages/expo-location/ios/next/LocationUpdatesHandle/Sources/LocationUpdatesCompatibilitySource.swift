import CoreLocation

final class LocationUpdatesCompatibilitySource: NSObject, CLLocationManagerDelegate {
  private lazy var manager = CLLocationManager()
  private var continuation: AsyncThrowingStream<CLLocation?, Error>.Continuation?

  func updates(for profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> {
    AsyncThrowingStream { continuation in
      self.continuation = continuation
      Task { @MainActor in
        self.manager.delegate = self
        self.manager.activityType = profile.clActivityType()
        self.manager.distanceFilter = profile.clDistanceFilter()
        self.manager.startUpdatingLocation()
      }
      continuation.onTermination = { _ in
        Task { @MainActor in
          self.manager.stopUpdatingLocation()
          self.manager.delegate = nil
        }
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
    default:
      continuation?.finish(throwing: error)
    }
  }
}
