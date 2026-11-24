import CoreLocation
import Foundation

final class PositionUpdatesSubscription {
  private let source: PositionUpdatesSource
  private let interval: TimeInterval
  private let onLocation: (CLLocation) -> Void
  private let onError: (Error) -> Void
  private let lock = NSRecursiveLock()
  private var lastEmittedAt: Date?
  private var active = true

  init(
    source: PositionUpdatesSource,
    interval: TimeInterval = 0,
    onLocation: @escaping (CLLocation) -> Void,
    onError: @escaping (Error) -> Void
  ) {
    self.source = source
    self.interval = interval
    self.onLocation = onLocation
    self.onError = onError
    Task { @MainActor [weak self] in
      do {
        for try await location in source.stream {
          guard let self, self.deliver(location) else {
            break
          }
        }
      } catch {
        self?.fail(error)
      }
      self?.finish()
    }
  }

  var isActive: Bool {
    lock.withLock {
      active
    }
  }

  func stop() {
    lock.withLock {
      active = false
    }
    source.stop()
  }

  private func deliver(_ location: CLLocation?) -> Bool {
    lock.withLock {
      guard active else {
        return false
      }
      guard let location else {
        return true
      }
      if let lastEmittedAt, location.timestamp.timeIntervalSince(lastEmittedAt) < interval {
        return true
      }
      lastEmittedAt = location.timestamp
      onLocation(location)
      return true
    }
  }

  private func fail(_ error: Error) {
    lock.withLock {
      guard active else {
        return
      }
      onError(error)
    }
  }

  private func finish() {
    lock.withLock {
      active = false
    }
  }

  deinit {
    stop()
  }
}
