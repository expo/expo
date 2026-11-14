import ExpoModulesCore
import os

private let interruptionEvent = "interruption"
private let routeChangeEvent = "routeChange"
private let activationErrorEvent = "activationError"
private let nowPlayingOwnerChangeEvent = "nowPlayingOwnerChange"

public class MediaSessionModule: Module {
  private let forwarder = EventForwarder()
  private let registration = OSAllocatedUnfairLock<ObserverRegistration?>(initialState: nil)

  public func definition() -> ModuleDefinition {
    Name("ExpoMediaSession")

    Events(interruptionEvent, routeChangeEvent, activationErrorEvent, nowPlayingOwnerChangeEvent)

    OnCreate {
      self.forwarder.module = self
    }

    OnStartObserving {
      self.registration.withLockUnchecked { registration in
        if registration == nil {
          registration = MediaSessionManager.shared.addObserver(self.forwarder)
        }
      }
    }

    OnStopObserving {
      self.stopObserving()
    }

    OnDestroy {
      self.stopObserving()
    }
  }

  private func stopObserving() {
    let removed = registration.withLock { registration in
      defer { registration = nil }
      return registration
    }
    removed?.remove()
  }
}

private final class EventForwarder: MediaSessionObserver {
  weak var module: MediaSessionModule?

  func mediaSessionInterruptionBegan(reason: InterruptionReason) {
    module?.sendEvent(interruptionEvent, ["type": "began", "reason": reason.rawValue])
  }

  func mediaSessionInterruptionEnded(shouldResume: Bool) {
    module?.sendEvent(interruptionEvent, ["type": "ended", "shouldResume": shouldResume])
  }

  func mediaSessionRouteChanged(reason: RouteChangeReason) {
    module?.sendEvent(routeChangeEvent, ["reason": reason.rawValue])
  }

  func mediaSession(didFail error: Error, client: String) {
    let message = (error as? Exception)?.description ?? error.localizedDescription
    module?.sendEvent(activationErrorEvent, ["message": message, "client": client])
  }

  func mediaSessionNowPlayingOwnerChanged(id: String?) {
    module?.sendEvent(nowPlayingOwnerChangeEvent, ["id": id])
  }
}
