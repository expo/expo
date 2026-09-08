import CoreLocation
import ExpoModulesCore

final class PositionWatcher: SharedObject {
  static let positionChangedEvent = "positionChanged"
  static var isAppInForeground = true

  var makeSource: (_ profile: Profile) -> PositionUpdatesSource = PositionUpdatesSource.foreground

  lazy var send: (_ payload: [String: Any]) -> Void = { [weak self] payload in
    self?.emit(event: Self.positionChangedEvent, payload: payload)
  }

  private var activeProfile: Profile
  private var stagedProfile: Profile
  private var activeInterval: TimeInterval = 0
  private var stagedInterval: TimeInterval = 0
  private let lock = NSRecursiveLock()
  private var subscription: PositionUpdatesSubscription?
  private var isStarted = false
  private var isPaused = false
  private var isReleased = false

  init(profile: Profile) {
    self.activeProfile = profile
    self.stagedProfile = profile
  }

  var isSubscribed: Bool {
    lock.withLock {
      subscription?.isActive == true
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
    let exception = (error as? Exception) ?? UnexpectedException(error)
    return ["error": ["code": exception.code, "message": exception.reason]]
  }

  private func reconcile() {
    let shouldStream = isStarted && !isPaused && !isReleased
    if shouldStream && !isSubscribed {
      startStreaming()
    }
    if !shouldStream {
      stopStreaming()
    }
  }

  private func startStreaming() {
    subscription = PositionUpdatesSubscription(
      source: makeSource(activeProfile),
      interval: activeInterval,
      onLocation: { [weak self] location in
        self?.send(Self.positionPayload(location))
      },
      onError: { [weak self] error in
        self?.send(Self.errorPayload(error))
      }
    )
  }

  private func stopStreaming() {
    subscription?.stop()
    subscription = nil
  }

  deinit {
    stopStreaming()
  }
}
