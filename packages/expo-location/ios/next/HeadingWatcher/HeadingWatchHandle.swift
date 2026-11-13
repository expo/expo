import CoreLocation
import ExpoModulesCore

final class HeadingWatchHandle: SharedObject {
  static let headingChangedEvent = "headingChanged"

  private let source: HeadingUpdatesSource
  private let lock = NSLock()
  private var activeFilter: CLLocationDegrees?
  private var stagedFilter: CLLocationDegrees?
  private var isStarted = false
  private var isPaused = false
  private var isReleased = false
  private var isStreaming = false

  init(filter: CLLocationDegrees?, source: HeadingUpdatesSource) throws {
    try Self.validate(filter)
    self.activeFilter = filter
    self.stagedFilter = filter
    self.source = source
    super.init()
    source.onHeading = { [weak self] heading in
      self?.deliver(heading)
    }
    source.onError = { [weak self] error in
      self?.fail(error)
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
      return isStreaming
    }
  }

  func withFilter(_ degrees: CLLocationDegrees) throws {
    try Self.validate(degrees)
    lock.withLock {
      stagedFilter = degrees
    }
  }

  func restart() -> Bool {
    lock.withLock {
      if stagedFilter != activeFilter {
        activeFilter = stagedFilter
        stopStreaming()
      }
      reconcile()
      return isStreaming
    }
  }

  func status() -> HeadingWatchStatus {
    lock.withLock {
      let status = HeadingWatchStatus()
      status.isSubscribed = isStreaming
      status.isHandleAlive = !isReleased
      status.isStarted = isStarted
      status.isPaused = isPaused
      return status
    }
  }

  override func sharedObjectWillRelease() {
    lock.withLock {
      isReleased = true
      reconcile()
    }
  }

  static func headingPayload(_ heading: Heading) -> [String: Any] {
    return ["data": heading.toEventPayload()]
  }

  static func errorPayload(_ error: Error) -> [String: Any] {
    let exception = (error as? Exception) ?? UnexpectedException(error)
    return ["error": ["code": exception.code, "message": exception.reason]]
  }

  private static func validate(_ degrees: CLLocationDegrees?) throws {
    guard let degrees else {
      return
    }
    guard degrees >= 0, degrees.isFinite else {
      throw InvalidHeadingFilterException()
    }
  }

  private func reconcile() {
    let shouldStream = isStarted && !isPaused && !isReleased
    if shouldStream && !isStreaming {
      startStreaming()
    }
    if !shouldStream && isStreaming {
      stopStreaming()
    }
  }

  private func startStreaming() {
    isStreaming = true
    let filter = activeFilter
    DispatchQueue.main.async { [source] in
      source.start(filter: filter)
    }
  }

  private func stopStreaming() {
    isStreaming = false
    DispatchQueue.main.async { [source] in
      source.stop()
    }
  }

  private func deliver(_ heading: Heading) {
    let shouldSend = lock.withLock {
      isStreaming
    }
    guard shouldSend else {
      return
    }
    emit(event: Self.headingChangedEvent, payload: Self.headingPayload(heading))
  }

  private func fail(_ error: Error) {
    let wasStreaming = lock.withLock {
      guard isStreaming else {
        return false
      }
      stopStreaming()
      return true
    }
    guard wasStreaming else {
      return
    }
    emit(event: Self.headingChangedEvent, payload: Self.errorPayload(error))
  }

  deinit {
    DispatchQueue.main.async { [source] in
      source.stop()
    }
  }
}
