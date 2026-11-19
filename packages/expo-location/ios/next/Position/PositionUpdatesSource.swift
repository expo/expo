import CoreLocation
import Foundation

final class PositionUpdatesSource {
  let stream: AsyncThrowingStream<CLLocation?, Error>
  private let continuation: AsyncThrowingStream<CLLocation?, Error>.Continuation

  init(
    stream: AsyncThrowingStream<CLLocation?, Error>,
    continuation: AsyncThrowingStream<CLLocation?, Error>.Continuation,
    stop: @escaping () -> Void
  ) {
    self.stream = stream
    self.continuation = continuation
    continuation.onTermination = { _ in
      stop()
    }
  }

  func stop() {
    continuation.finish()
  }
}

extension PositionUpdatesSource {
  static func foreground(for profile: Profile) -> PositionUpdatesSource {
    return updates(for: profile, allowsBackgroundUpdates: false)
  }

  static func background(for profile: Profile) -> PositionUpdatesSource {
    return updates(for: profile, allowsBackgroundUpdates: true)
  }

  private static func updates(for profile: Profile, allowsBackgroundUpdates: Bool) -> PositionUpdatesSource {
    if profile != .lowPower, #available(iOS 17.0, *) {
      return PositionUpdatesLiveSource().updates(for: profile, allowsBackgroundUpdates: allowsBackgroundUpdates)
    }
    return PositionUpdatesCompatibilitySource().updates(for: profile, allowsBackgroundUpdates: allowsBackgroundUpdates)
  }
}
