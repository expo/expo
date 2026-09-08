import CoreLocation
import Foundation

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
    action?()
  }
}
