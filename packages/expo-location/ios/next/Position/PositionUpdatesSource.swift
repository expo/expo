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
    if profile == .lowPower {
      return PositionUpdatesCompatibilitySource().updates(for: profile)
    }
    if #available(iOS 17.0, *) {
      return PositionUpdatesLiveSource().updates(for: profile)
    }
    return PositionUpdatesCompatibilitySource().updates(for: profile)
  }
}
