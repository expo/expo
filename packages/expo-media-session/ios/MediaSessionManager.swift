import os

public struct RouteChangeReason: RawRepresentable, Hashable, Sendable {
  public let rawValue: String

  public init(rawValue: String) {
    self.rawValue = rawValue
  }

  public static let oldDeviceUnavailable = RouteChangeReason(rawValue: "oldDeviceUnavailable")
  public static let newDeviceAvailable = RouteChangeReason(rawValue: "newDeviceAvailable")
  public static let categoryChange = RouteChangeReason(rawValue: "categoryChange")
  public static let other = RouteChangeReason(rawValue: "other")
}

public struct InterruptionReason: RawRepresentable, Hashable, Sendable {
  public let rawValue: String

  public init(rawValue: String) {
    self.rawValue = rawValue
  }

  public static let `default` = InterruptionReason(rawValue: "default")
  public static let routeDisconnected = InterruptionReason(rawValue: "routeDisconnected")
  public static let builtInMicMuted = InterruptionReason(rawValue: "builtInMicMuted")
}

/// Called on the coordinator queue.
public protocol MediaSessionObserver: AnyObject {
  func mediaSession(didFail error: Error, client: String)
  func mediaSessionDidSuspendWrites(reason: String)
  func mediaSessionDidResumeWrites()
  func mediaSessionInterruptionBegan(reason: InterruptionReason)
  func mediaSessionInterruptionEnded(shouldResume: Bool)
  func mediaSessionRouteChanged(reason: RouteChangeReason)
  func mediaSessionDucked(_ isDucked: Bool)
  func mediaSessionFocusLost(transient: Bool)
  func mediaSessionServicesReset()
  func mediaSessionSilentModeChanged(isSilent: Bool)
}

extension MediaSessionObserver {
  public func mediaSession(didFail error: Error, client: String) {}
  public func mediaSessionDidSuspendWrites(reason: String) {}
  public func mediaSessionDidResumeWrites() {}
  public func mediaSessionInterruptionBegan(reason: InterruptionReason) {}
  public func mediaSessionInterruptionEnded(shouldResume: Bool) {}
  public func mediaSessionRouteChanged(reason: RouteChangeReason) {}
  public func mediaSessionDucked(_ isDucked: Bool) {}
  public func mediaSessionFocusLost(transient: Bool) {}
  public func mediaSessionServicesReset() {}
  public func mediaSessionSilentModeChanged(isSilent: Bool) {}
}

/// The manager keeps the observer until `remove()` is called or this registration is deallocated.
public final class ObserverRegistration: Sendable {
  private let removal: OSAllocatedUnfairLock<(@Sendable () -> Void)?>

  init(remove: @escaping @Sendable () -> Void) {
    removal = OSAllocatedUnfairLock(initialState: remove)
  }

  deinit {
    remove()
  }

  public func remove() {
    let removal = removal.withLock { removal in
      defer { removal = nil }
      return removal
    }
    removal?()
  }
}

public final class MediaSessionManager: @unchecked Sendable {
  public static let shared = MediaSessionManager(
    backend: AVAudioSessionBackend(),
    scheduler: DispatchScheduler(),
    observesSystemEvents: true
  )

  let coordinator: SessionCoordinator
  private let systemEvents: SystemEventSource?

  init(
    backend: any SessionBackend,
    scheduler: any Scheduler,
    observesSystemEvents: Bool = false,
    log: @escaping @Sendable (String) -> Void = { print($0) }
  ) {
    coordinator = SessionCoordinator(backend: backend, scheduler: scheduler, log: log)
    systemEvents = observesSystemEvents ? SystemEventSource(coordinator: coordinator) : nil
  }

  public var policy: AudioPolicy {
    coordinator.policy
  }

  public func beginUse(client: String, requirements: SessionRequirements = .init()) -> SessionUse {
    let activation = ActivationSignal()
    let id = coordinator.begin(client: client, requirements: requirements, activation: activation)
    return SessionUse(id: id, client: client, activation: activation, coordinator: coordinator)
  }

  public func hold(client: String) -> SessionHold {
    let activation = ActivationSignal()
    let id = coordinator.begin(client: client, requirements: .init(), activation: activation)
    return SessionHold(id: id, client: client, activation: activation, coordinator: coordinator)
  }

  public func suspendWrites(reason: String) {
    coordinator.suspendWrites(reason: reason)
  }

  public func resumeWrites() {
    coordinator.resumeWrites()
  }

  public func setPolicy(_ update: AudioPolicyUpdate) throws {
    try coordinator.setPolicy(update)
  }

  public func addObserver(_ observer: any MediaSessionObserver) -> ObserverRegistration {
    coordinator.addObserver(observer)
  }
}

/// Store the token for as long as the audio plays. Deinit ends the use.
public final class SessionUse: @unchecked Sendable {
  private let id: UInt64
  private let client: String
  private let activation: ActivationSignal
  private weak var coordinator: SessionCoordinator?
  private let ended = OSAllocatedUnfairLock(initialState: false)

  init(id: UInt64, client: String, activation: ActivationSignal, coordinator: SessionCoordinator) {
    self.id = id
    self.client = client
    self.activation = activation
    self.coordinator = coordinator
  }

  deinit {
    end()
  }

  var isActivationPending: Bool {
    activation.isPending
  }

  var activationWaiterCount: Int {
    activation.waiterCount
  }

  public func activated() async throws {
    guard !ended.withLock({ $0 }) else {
      throw SessionUseEndedException(client)
    }
    try await activation.wait()
  }

  public func update(_ requirements: SessionRequirements) {
    guard !ended.withLock({ $0 }) else {
      return
    }
    coordinator?.update(id: id, requirements: requirements)
  }

  public func end() {
    let wasEnded = ended.withLock { ended in
      defer { ended = true }
      return ended
    }
    if !wasEnded {
      activation.finish(.failure(SessionUseEndedException(client)))
      coordinator?.end(id: id)
    }
  }
}

/// Store the token for as long as the session must stay active. Deinit releases the hold.
public final class SessionHold: @unchecked Sendable {
  private let id: UInt64
  private let client: String
  private let activation: ActivationSignal
  private weak var coordinator: SessionCoordinator?
  private let released = OSAllocatedUnfairLock(initialState: false)

  init(id: UInt64, client: String, activation: ActivationSignal, coordinator: SessionCoordinator) {
    self.id = id
    self.client = client
    self.activation = activation
    self.coordinator = coordinator
  }

  deinit {
    release()
  }

  public func activated() async throws {
    guard !released.withLock({ $0 }) else {
      throw SessionUseEndedException(client)
    }
    try await activation.wait()
  }

  public func release() {
    let wasReleased = released.withLock { released in
      defer { released = true }
      return released
    }
    if !wasReleased {
      activation.finish(.failure(SessionUseEndedException(client)))
      coordinator?.end(id: id)
    }
  }
}
