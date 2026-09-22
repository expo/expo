import CoreLocation

enum LocationUpdatesSourceSelector {
  static func updates(for profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> {
    if profile == .lowPower {
      return LocationUpdatesCompatibilitySource().updates(for: profile)
    }
    if #available(iOS 17.0, *) {
      return LocationUpdatesLiveSource().updates(for: profile)
    }
    return LocationUpdatesCompatibilitySource().updates(for: profile)
  }
}
