import CoreLocation

enum PositionUpdatesSourceSelector {
  static func updates(for profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> {
    if profile == .lowPower {
      return PositionUpdatesCompatibilitySource().updates(for: profile)
    }
    if #available(iOS 17.0, *) {
      return PositionUpdatesLiveSource().updates(for: profile)
    }
    return PositionUpdatesCompatibilitySource().updates(for: profile)
  }
}
