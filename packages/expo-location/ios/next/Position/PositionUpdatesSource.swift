import CoreLocation
import Foundation

/// One subscription, with explicit, idempotent cleanup shared with stream termination.
final class PositionUpdatesSource {
  let stream: AsyncThrowingStream<CLLocation?, Error>
  private let stopAction: StopAction

  init(
    stream: AsyncThrowingStream<CLLocation?, Error>,
    continuation: AsyncThrowingStream<CLLocation?, Error>.Continuation,
    stop: @escaping () -> Void
  ) {
    self.stream = stream
    let stopAction = StopAction {
      stop()
      continuation.finish()
    }
    self.stopAction = stopAction
    continuation.onTermination = { _ in
      stopAction.run()
    }
  }

  func stop() {
    stopAction.run()
  }
}

private final class StopAction: @unchecked Sendable {
  private let lock = NSLock()
  private var action: (() -> Void)?

  init(_ action: @escaping () -> Void) {
    self.action = action
  }

  func run() {
    let action = lock.withLock {
      let action = self.action
      self.action = nil
      return action
    }
    // finish() invokes onTermination synchronously, so cleanup must run outside the lock.
    action?()
  }
}
