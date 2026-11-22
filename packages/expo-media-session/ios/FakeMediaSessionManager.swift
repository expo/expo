#if DEBUG
import Foundation

public final class FakeMediaSessionManager: MediaSessionManaging, @unchecked Sendable {
  public final class Use: SessionUse, @unchecked Sendable {
    public let client: String
    public private(set) var requirements: SessionRequirements
    public private(set) var isEnded = false
    public private(set) var isEndedByModule = false
    private var isEndedByClient = false
    weak var delegate: (any SessionUseDelegate)?
    let queue: DispatchQueue
    var activationError: Error?

    init(
      client: String,
      requirements: SessionRequirements,
      delegate: (any SessionUseDelegate)?,
      queue: DispatchQueue,
      activationError: Error?
    ) {
      self.client = client
      self.requirements = requirements
      self.delegate = delegate
      self.queue = queue
      self.activationError = activationError
    }

    public func activated() async throws {
      if let activationError {
        throw activationError
      }
      if isEnded {
        throw SessionUseEndedException(client)
      }
    }

    public func update(_ requirements: SessionRequirements) {
      if !isEnded {
        self.requirements = requirements
      }
    }

    public func end() {
      isEndedByClient = true
      isEnded = true
    }

    private func markEndedByModule() {
      isEndedByModule = true
      isEnded = true
    }

    public func pause(reason: SessionPauseReason) {
      send { $0.sessionUse($1, pause: reason) }
    }

    public func resume() {
      send { $0.sessionUseResume($1) }
    }

    public func duck(_ isDucked: Bool) {
      send { $0.sessionUse($1, duck: isDucked) }
    }

    public func fail(with error: Error) {
      send { $0.sessionUse($1, didFail: error) }
    }

    public func endByModule(reason: SessionPauseReason? = nil) {
      guard !isEnded else {
        return
      }
      if let reason {
        pause(reason: reason)
      }
      markEndedByModule()
      send { $0.sessionUseDidEnd($1) }
    }

    public func endByModule(error: Error) {
      guard !isEnded else {
        return
      }
      fail(with: error)
      markEndedByModule()
      send { $0.sessionUseDidEnd($1) }
    }

    private func send(_ body: @escaping @Sendable (any SessionUseDelegate, Use) -> Void) {
      queue.async { [weak self] in
        guard let self, !self.isEndedByClient, let delegate = self.delegate else {
          return
        }
        body(delegate, self)
      }
    }
  }

  public final class Hold: SessionHold, @unchecked Sendable {
    public let client: String
    public private(set) var isReleased = false

    init(client: String) {
      self.client = client
    }

    public func activated() async throws {}

    public func release() {
      isReleased = true
    }
  }

  private final class InertClaim: NowPlayingClaim, @unchecked Sendable {
    func update(_ info: NowPlayingInfo, commands: Set<RemoteCommandKind>?) {}
    func withdraw() {}
  }

  private final class InertRegistration: ObserverRegistration, @unchecked Sendable {
    func remove() {}
  }

  public private(set) var uses: [Use] = []
  public private(set) var holds: [Hold] = []
  public private(set) var policy = AudioPolicy.default
  public let nowPlayingOwner: (any NowPlayingOwner)? = nil
  private var nextActivationError: Error?

  public init() {}

  public func beginUse(
    client: String,
    requirements: SessionRequirements,
    delegate: (any SessionUseDelegate)?,
    queue: DispatchQueue
  ) -> any SessionUse {
    let use = Use(
      client: client,
      requirements: requirements,
      delegate: delegate,
      queue: queue,
      activationError: nextActivationError
    )
    if let error = nextActivationError {
      use.endByModule(error: error)
    }
    nextActivationError = nil
    uses.append(use)
    return use
  }

  public func hold(client: String) -> any SessionHold {
    let hold = Hold(client: client)
    holds.append(hold)
    return hold
  }

  public func setPolicy(_ update: AudioPolicyUpdate) throws {
    let merged = policy.merged(with: update)
    try merged.validate()
    policy = merged
  }

  public func suspendWrites(reason: String) {}

  public func resumeWrites() {}

  public func offerNowPlaying(
    _ owner: any NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ) -> any NowPlayingClaim {
    InertClaim()
  }

  public func addObserver(_ observer: any MediaSessionObserver) -> any ObserverRegistration {
    InertRegistration()
  }

  public func failNextActivation(with error: Error) {
    nextActivationError = error
  }
}
#endif
