import ExpoModulesCore

@Record
struct InterruptionEvent {
  var type: String
  var reason: String?
  var shouldResume: Bool?
}

@Record
struct RouteChangeEvent {
  var reason: String
}

@Record
struct ActivationErrorEvent {
  var message: String
  var client: String
}

@ExpoModule("ExpoMediaSession")
public final class MediaSessionModule: Module {
  private let forwarder = EventForwarder()
  private let listening = Mutex(Listening())

  @Event
  var onInterruption: (InterruptionEvent) -> Void

  @Event
  var onRouteChange: (RouteChangeEvent) -> Void

  @Event
  var onActivationError: (ActivationErrorEvent) -> Void

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
    let removed = listening.withLock { listening -> ObserverRegistration? in
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
  }
}

private struct Listening {
  var events: Set<String> = []
  var registration: ObserverRegistration?
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
}
