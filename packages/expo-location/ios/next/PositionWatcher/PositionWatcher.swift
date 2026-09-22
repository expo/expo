import CoreLocation
import ExpoModulesCore

final class PositionWatcher: SharedObject {
  static let positionChangedEvent = "positionChanged"
  static var isAppInForeground = true

  var liveUpdates: (_ profile: Profile) -> AsyncThrowingStream<CLLocation?, Error> = PositionUpdatesSourceSelector.updates

  lazy var send: (_ payload: [String: Any]) -> Void = { [weak self] payload in
    self?.emit(event: Self.positionChangedEvent, payload: payload)
  }

  private var activeProfile: Profile
  private var stagedProfile: Profile
  private var activeInterval: TimeInterval = 0
  private var stagedInterval: TimeInterval = 0
  private var streamingTask: Task<Void, Never>?
  private var lastEmittedAt: Date?
  private var isStarted = false
  private var isPaused = false
  private var isReleased = false

  init(profile: Profile) {
    self.activeProfile = profile
    self.stagedProfile = profile
  }

  var isSubscribed: Bool {
    streamingTask != nil
  }

  func start() {
    isStarted = true
    reconcile()
  }

  func pause() {
    isPaused = true
    reconcile()
  }

  func resume() -> Bool {
    isPaused = false
    reconcile()
    return isSubscribed
  }

  func withProfile(_ profile: Profile) {
    stagedProfile = profile
  }

  func withInterval(_ seconds: TimeInterval) {
    stagedInterval = seconds
  }

  func restart() -> Bool {
    if stagedProfile != activeProfile || stagedInterval != activeInterval {
      activeProfile = stagedProfile
      activeInterval = stagedInterval
      cancelStreaming()
    }
    reconcile()
    return isSubscribed
  }

  func status() -> PositionWatchStatus {
    let status = PositionWatchStatus()
    status.isSubscribed = isSubscribed
    status.isHandleAlive = !isReleased
    status.isStarted = isStarted
    status.isPaused = isPaused
    status.isInForeground = Self.isAppInForeground
    return status
  }

  override func sharedObjectWillRelease() {
    isReleased = true
    reconcile()
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
    if shouldStream && streamingTask == nil {
      startStreaming()
    }
    if !shouldStream {
      cancelStreaming()
    }
  }

  private func startStreaming() {
    let interval = activeInterval
    let stream = liveUpdates(activeProfile)
    streamingTask = Task { [weak self] in
      do {
        for try await location in stream {
          guard let self, let location else {
            continue
          }
          if let lastEmittedAt, location.timestamp.timeIntervalSince(lastEmittedAt) < interval {
            continue
          }
          lastEmittedAt = location.timestamp
          send(Self.positionPayload(location))
        }
      } catch {
        self?.send(Self.errorPayload(error))
      }
      if !Task.isCancelled {
        self?.streamingTask = nil
      }
    }
  }

  private func cancelStreaming() {
    streamingTask?.cancel()
    streamingTask = nil
  }

  deinit {
    cancelStreaming()
  }
}
