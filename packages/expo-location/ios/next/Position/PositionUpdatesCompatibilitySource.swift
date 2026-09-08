import CoreLocation

final class PositionUpdatesCompatibilitySource: NSObject, CLLocationManagerDelegate {
  private lazy var manager = CLLocationManager()
  private var continuation: AsyncThrowingStream<CLLocation?, Error>.Continuation?

  func updates(for profile: Profile) -> PositionUpdatesSource {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: CLLocation?.self)
    self.continuation = continuation
    // FIFO dispatch keeps an immediate stop behind setup on the main queue.
    DispatchQueue.main.async {
      self.manager.delegate = self
      self.manager.activityType = profile.clActivityType()
      self.manager.distanceFilter = profile.clDistanceFilter()
      self.manager.desiredAccuracy = profile.clDesiredAccuracy()
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
    default:
      continuation?.finish(throwing: error)
    }
  }
}
