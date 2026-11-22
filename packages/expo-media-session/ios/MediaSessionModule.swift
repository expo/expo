import ExpoModulesCore
import Foundation

@ExpoModule("ExpoMediaSession", classes: [JSNowPlayingOwner.self])
public final class MediaSessionModule: Module {
  private let forwarder = EventForwarder()
  private let listening = Mutex(Listening())
  private let holds = Mutex<[String: any SessionHold]>([:])

  @Event
  var onInterruption: (InterruptionEvent) -> Void

  @Event
  var onRouteChange: (RouteChangeEvent) -> Void

  @Event
  var onActivationError: (ActivationErrorEvent) -> Void

  @Event
  var onNowPlayingOwnerChange: () -> Void

  @JS(.concurrent)
  func setAudioPolicyAsync(_ policy: AudioPolicyRecord) async throws {
    try MediaSessionManager.shared.setPolicy(policy.update)
  }

  @JS
  func getAudioPolicy() -> AudioPolicyRecord {
    AudioPolicyRecord(MediaSessionManager.shared.policy)
  }

  @JS
  func holdSession(_ key: String) {
    let hold = MediaSessionManager.shared.hold(client: key)
    let previous = holds.withLock { $0.updateValue(hold, forKey: key) }
    previous?.release()
  }

  @JS
  func releaseSession(_ key: String) {
    let hold = holds.withLock { $0.removeValue(forKey: key) }
    hold?.release()
  }

  @JS
  func getNowPlayingOwner() -> JSNowPlayingOwner? {
    MediaSessionManager.shared.nowPlayingOwner as? JSNowPlayingOwner
  }

  @JS
  func createNowPlayingOwner(_ mediaType: String) -> JSNowPlayingOwner {
    JSNowPlayingOwner(mediaType: NowPlayingMediaType(rawValue: mediaType))
  }

  public override func didCreate() {
    forwarder.module = self
  }

  public override func didStartListening(event: String) {
    listening.withLock { listening in
      listening.events.insert(event)
      if listening.registration == nil {
        listening.registration = MediaSessionManager.shared.addObserver(forwarder)
      }
    }
  }

  public override func didStopListening(event: String) {
    let removed = listening.withLock { listening -> (any ObserverRegistration)? in
      listening.events.remove(event)
      guard listening.events.isEmpty else {
        return nil
      }
      defer { listening.registration = nil }
      return listening.registration
    }
    removed?.remove()
  }

  public override func willDestroy() {
    let removed = listening.withLock { listening in
      defer { listening = Listening() }
      return listening.registration
    }
    removed?.remove()
    let released = holds.withLock { holds in
      defer { holds = [:] }
      return holds
    }
    for hold in released.values {
      hold.release()
    }
  }
}

private struct Listening {
  var events: Set<String> = []
  var registration: (any ObserverRegistration)?
}

private final class EventForwarder: MediaSessionObserver {
  weak var module: MediaSessionModule?

  func mediaSessionInterruptionBegan(reason: InterruptionReason) {
    module?.onInterruption(InterruptionEvent(type: "began", reason: reason.rawValue))
  }

  func mediaSessionInterruptionEnded(shouldResume: Bool) {
    module?.onInterruption(InterruptionEvent(type: "ended", shouldResume: shouldResume))
  }

  func mediaSessionRouteChanged(reason: RouteChangeReason) {
    module?.onRouteChange(RouteChangeEvent(reason: reason.rawValue))
  }

  func mediaSession(didFail error: Error, client: String) {
    let message = (error as? Exception)?.description ?? error.localizedDescription
    module?.onActivationError(ActivationErrorEvent(message: message, client: client))
  }

  func mediaSessionNowPlayingOwnerChanged(_ owner: (any NowPlayingOwner)?) {
    module?.onNowPlayingOwnerChange()
  }
}
