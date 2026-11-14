import os

/// Called on the coordinator queue.
public protocol MediaSessionObserver: AnyObject {
  func mediaSession(didFail error: Error, client: String)
  func mediaSessionDidSuspendWrites(reason: String)
  func mediaSessionDidResumeWrites()
}

extension MediaSessionObserver {
  public func mediaSession(didFail error: Error, client: String) {}
  public func mediaSessionDidSuspendWrites(reason: String) {}
  public func mediaSessionDidResumeWrites() {}
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
  public static let shared = MediaSessionManager(backend: AVAudioSessionBackend(), scheduler: DispatchScheduler())

  let coordinator: SessionCoordinator

  init(backend: any SessionBackend, scheduler: any Scheduler) {
    coordinator = SessionCoordinator(backend: backend, scheduler: scheduler)
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
