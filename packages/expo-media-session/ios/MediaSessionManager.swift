import ExpoModulesCore

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
  func mediaSessionNowPlayingOwnerChanged(_ owner: (any NowPlayingOwner)?)
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
  public func mediaSessionNowPlayingOwnerChanged(_ owner: (any NowPlayingOwner)?) {}
}

final class CoordinatorObserverRegistration: ObserverRegistration {
  private let removal: Mutex<(@Sendable () -> Void)?>

  init(remove: @escaping @Sendable () -> Void) {
    removal = Mutex(remove)
  }

  deinit {
    remove()
  }

  func remove() {
    let removal = removal.withLock { removal in
      defer { removal = nil }
      return removal
    }
    removal?()
  }
}

public final class MediaSessionManager: MediaSessionManaging, @unchecked Sendable {
  public static let shared = MediaSessionManager(
    backend: AVAudioSessionBackend(),
    scheduler: DispatchScheduler(),
    nowPlayingCenter: MPNowPlayingCenterBackend(),
    observesSystemEvents: true
  )

  let coordinator: SessionCoordinator
  let nowPlaying: NowPlayingStack
  private let systemEvents: SystemEventSource?
  private let nowPlayingEvents: any ObserverRegistration

  init(
    backend: any SessionBackend,
    scheduler: any Scheduler,
    nowPlayingCenter: any NowPlayingCenterBackend,
    observesSystemEvents: Bool = false,
    log: @escaping @Sendable (String) -> Void = { print($0) }
  ) {
    let coordinator = SessionCoordinator(backend: backend, scheduler: scheduler, log: log)
    self.coordinator = coordinator
    nowPlaying = NowPlayingStack(
      center: nowPlayingCenter,
      scheduler: scheduler,
      mixingMode: { [weak coordinator] in coordinator?.effectiveInterruptionMode ?? .mixWithOthers },
      isInterrupted: { [weak coordinator] in coordinator?.isInterrupted ?? false },
      onOwnerChange: { [weak coordinator] owner in
        coordinator?.notify { $0.mediaSessionNowPlayingOwnerChanged(owner) }
      }
    )
    nowPlayingEvents = coordinator.addObserver(NowPlayingEventForwarder(stack: nowPlaying))
    systemEvents = observesSystemEvents ? SystemEventSource(coordinator: coordinator) : nil
  }

  public var policy: AudioPolicy {
    coordinator.policy
  }

  public func beginUse(
    client: String,
    requirements: SessionRequirements,
    delegate: (any SessionUseDelegate)?,
    queue: DispatchQueue
  ) -> any SessionUse {
    let activation = ActivationSignal()
    let id = coordinator.reserveID()
    let use = CoordinatorSessionUse(id: id, client: client, activation: activation, coordinator: coordinator)
    coordinator.begin(
      id: id,
      client: client,
      requirements: requirements,
      activation: activation,
      delegate: delegate,
      queue: queue,
      token: use
    )
    return use
  }

  public func hold(client: String) -> any SessionHold {
    let activation = ActivationSignal()
    let id = coordinator.reserveID()
    coordinator.begin(
      id: id,
      client: client,
      requirements: .init(),
      activation: activation,
      delegate: nil,
      queue: .main,
      token: nil
    )
    return CoordinatorSessionHold(id: id, client: client, activation: activation, coordinator: coordinator)
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

  public func offerNowPlaying(
    _ owner: any NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ) -> any NowPlayingClaim {
    nowPlaying.offer(owner, info: info, commands: commands)
  }

  public var nowPlayingOwner: (any NowPlayingOwner)? {
    nowPlaying.owner
  }

  public func addObserver(_ observer: any MediaSessionObserver) -> any ObserverRegistration {
    coordinator.addObserver(observer)
  }
}

final class CoordinatorSessionUse: SessionUse, @unchecked Sendable {
  private let id: UInt64
  private let client: String
  private let activation: ActivationSignal
  private weak var coordinator: SessionCoordinator?
  private let state = Mutex(State.live)

  private enum State {
    case live
    case endedByModule
    case endedByClient
  }

  init(id: UInt64, client: String, activation: ActivationSignal, coordinator: SessionCoordinator) {
    self.id = id
    self.client = client
    self.activation = activation
    self.coordinator = coordinator
  }

  deinit {
    end()
  }

  var acceptsCommands: Bool {
    state.withLock { $0 != .endedByClient }
  }

  private var isLive: Bool {
    state.withLock { $0 == .live }
  }

  var isActivationPending: Bool {
    activation.isPending
  }

  var activationWaiterCount: Int {
    activation.waiterCount
  }

  func activated() async throws {
    guard isLive else {
      throw SessionUseEndedException(client)
    }
    try await activation.wait()
  }

  func update(_ requirements: SessionRequirements) {
    guard isLive else {
      return
    }
    coordinator?.update(id: id, requirements: requirements)
  }

  func end() {
    let previous = state.withLock { state in
      defer { state = .endedByClient }
      return state
    }
    if previous == .live {
      activation.finish(.failure(SessionUseEndedException(client)))
      coordinator?.end(id: id)
    }
  }

  func markEndedByCoordinator() {
    state.withLock { state in
      if state == .live {
        state = .endedByModule
      }
    }
  }
}

final class CoordinatorSessionHold: SessionHold, @unchecked Sendable {
  private let id: UInt64
  private let client: String
  private let activation: ActivationSignal
  private weak var coordinator: SessionCoordinator?
  private let released = Mutex(false)

  init(id: UInt64, client: String, activation: ActivationSignal, coordinator: SessionCoordinator) {
    self.id = id
    self.client = client
    self.activation = activation
    self.coordinator = coordinator
  }

  deinit {
    release()
  }

  func activated() async throws {
    guard !released.withLock({ $0 }) else {
      throw SessionUseEndedException(client)
    }
    try await activation.wait()
  }

  func release() {
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

private final class NowPlayingEventForwarder: MediaSessionObserver {
  private weak var stack: NowPlayingStack?

  init(stack: NowPlayingStack) {
    self.stack = stack
  }

  func mediaSessionInterruptionEnded(shouldResume: Bool) {
    stack?.interruptionEnded(shouldResume: shouldResume)
  }

  func mediaSessionServicesReset() {
    stack?.servicesReset()
  }
}
