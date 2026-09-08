import CoreLocation
import ExpoModulesCore

final class PositionWatcher: SharedObject {
  static let positionChangedEvent = "positionChanged"
  static var isAppInForeground = true

  var makeSource: (_ profile: Profile) -> PositionUpdatesSource = PositionUpdatesSourceSelector.source

  lazy var send: (_ payload: [String: Any]) -> Void = { [weak self] payload in
    self?.emit(event: Self.positionChangedEvent, payload: payload)
  }

  private var activeProfile: Profile
  private var stagedProfile: Profile
  private var activeInterval: TimeInterval = 0
  private var stagedInterval: TimeInterval = 0
  private let lock = NSRecursiveLock()
  private var streamingSource: PositionUpdatesSource?
  private var lastEmittedAt: Date?
  private var isStarted = false
  private var isPaused = false
  private var isReleased = false

  init(profile: Profile) {
    self.activeProfile = profile
    self.stagedProfile = profile
  }

  var isSubscribed: Bool {
    lock.withLock {
      streamingSource != nil
    }
  }

  func start() {
    lock.withLock {
      isStarted = true
      reconcile()
    }
  }

  func pause() {
    lock.withLock {
      isPaused = true
      reconcile()
    }
  }

  func resume() -> Bool {
    lock.withLock {
      isPaused = false
      reconcile()
      return isSubscribed
    }
  }

  func withProfile(_ profile: Profile) {
    lock.withLock {
      stagedProfile = profile
    }
  }

  func withInterval(_ seconds: TimeInterval) {
    lock.withLock {
      stagedInterval = seconds
    }
  }

  func restart() -> Bool {
    lock.withLock {
      if stagedProfile != activeProfile || stagedInterval != activeInterval {
        activeProfile = stagedProfile
        activeInterval = stagedInterval
        stopStreaming()
      }
      reconcile()
      return isSubscribed
    }
  }

  func status() -> PositionWatchStatus {
    lock.withLock {
      let status = PositionWatchStatus()
      status.isSubscribed = isSubscribed
      status.isHandleAlive = !isReleased
      status.isStarted = isStarted
      status.isPaused = isPaused
      status.isInForeground = Self.isAppInForeground
      return status
    }
  }

  override func sharedObjectWillRelease() {
    lock.withLock {
      isReleased = true
      reconcile()
    }
  }

  static func positionPayload(_ location: CLLocation) -> [String: Any] {
    return ["data": location.toPosition().toEventPayload()]
  }

  static func errorPayload(_ error: Error) -> [String: Any] {
    if let exception = error as? Exception {
      return ["error": exception.code]
    }
    return ["error": error.localizedDescription]
  }

  private func reconcile() {
    let shouldStream = isStarted && !isPaused && !isReleased
    if shouldStream && streamingSource == nil {
      startStreaming()
    }
    if !shouldStream {
      stopStreaming()
    }
  }

  private func startStreaming() {
    let interval = activeInterval
    let source = makeSource(activeProfile)
    streamingSource = source
    Task { [weak self] in
      do {
        for try await location in source.stream {
          guard self?.handle(location, from: source, interval: interval) == true else {
            break
          }
        }
      } catch {
        self?.handle(error, from: source)
      }
      source.stop()
      self?.finishStreaming(source)
    }
  }

  private func stopStreaming() {
    let source = streamingSource
    streamingSource = nil
    source?.stop()
  }

  private func handle(_ location: CLLocation?, from source: PositionUpdatesSource, interval: TimeInterval) -> Bool {
    lock.withLock {
      guard streamingSource === source else { return false }
      guard let location else { return true }
      if let lastEmittedAt, location.timestamp.timeIntervalSince(lastEmittedAt) < interval {
        return true
      }
      lastEmittedAt = location.timestamp
      send(Self.positionPayload(location))
      return true
    }
  }

  private func handle(_ error: Error, from source: PositionUpdatesSource) {
    lock.withLock {
      guard streamingSource === source else { return }
      send(Self.errorPayload(error))
    }
  }

  private func finishStreaming(_ source: PositionUpdatesSource) {
    lock.withLock {
      guard streamingSource === source else { return }
      streamingSource = nil
    }
  }

  deinit {
    stopStreaming()
  }
}
