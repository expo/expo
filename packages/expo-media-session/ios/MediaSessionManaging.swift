import ExpoModulesCore

public protocol MediaSessionManaging: AnyObject, Sendable {
  var policy: AudioPolicy { get }
  var nowPlayingOwner: (any NowPlayingOwner)? { get }
  func beginUse(
    client: String,
    requirements: SessionRequirements,
    delegate: (any SessionUseDelegate)?,
    queue: DispatchQueue
  ) -> any SessionUse
  func hold(client: String) -> any SessionHold
  func setPolicy(_ update: AudioPolicyUpdate) throws
  func suspendWrites(reason: String)
  func resumeWrites()
  func offerNowPlaying(
    _ owner: any NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ) -> any NowPlayingClaim
  func addObserver(_ observer: any MediaSessionObserver) -> any ObserverRegistration
}

extension MediaSessionManaging {
  public func beginUse(client: String, requirements: SessionRequirements = .init()) -> any SessionUse {
    beginUse(client: client, requirements: requirements, delegate: nil, queue: .main)
  }

  public func beginUse(
    client: String,
    requirements: SessionRequirements,
    delegate: (any SessionUseDelegate)?
  ) -> any SessionUse {
    beginUse(client: client, requirements: requirements, delegate: delegate, queue: .main)
  }
}

/// The module's tokens end the use on deinit.
public protocol SessionUse: AnyObject, Sendable {
  func activated() async throws
  func update(_ requirements: SessionRequirements)
  func end()
}

/// The module's tokens release the hold on deinit.
public protocol SessionHold: AnyObject, Sendable {
  func activated() async throws
  func release()
}

/// The module's claims withdraw on deinit.
public protocol NowPlayingClaim: AnyObject, Sendable {
  func update(_ info: NowPlayingInfo, commands: Set<RemoteCommandKind>?)
  func withdraw()
}

extension NowPlayingClaim {
  public func update(_ info: NowPlayingInfo) {
    update(info, commands: nil)
  }
}

/// The module keeps the observer until `remove()` is called or the registration is deallocated.
public protocol ObserverRegistration: AnyObject, Sendable {
  func remove()
}
