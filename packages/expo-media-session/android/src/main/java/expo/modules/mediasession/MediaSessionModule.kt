package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MediaSessionModule : Module() {
  private val registrationLock = Any()
  private var registration: ObserverRegistration? = null

  private val forwarder = object : MediaSessionObserver {
    override fun mediaSessionInterruptionBegan(reason: InterruptionReason) {
      sendEvent(INTERRUPTION, mapOf("type" to "began", "reason" to reason.raw))
    }

    override fun mediaSessionInterruptionEnded(shouldResume: Boolean) {
      sendEvent(INTERRUPTION, mapOf("type" to "ended", "shouldResume" to shouldResume))
    }

    override fun mediaSessionRouteChanged(reason: RouteChangeReason) {
      sendEvent(ROUTE_CHANGE, mapOf("reason" to reason.raw))
    }

    override fun mediaSessionDidFail(error: CodedException, client: String) {
      sendEvent(ACTIVATION_ERROR, mapOf("message" to error.message, "client" to client))
    }

    override fun mediaSessionNowPlayingOwnerChanged(id: String?) {
      sendEvent(NOW_PLAYING_OWNER_CHANGE, mapOf("id" to id))
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMediaSession")

    Events(INTERRUPTION, ROUTE_CHANGE, ACTIVATION_ERROR, NOW_PLAYING_OWNER_CHANGE)

    OnStartObserving {
      val context = appContext.reactContext ?: return@OnStartObserving
      synchronized(registrationLock) {
        if (registration == null) {
          registration = MediaSessionManager.get(context).addObserver(forwarder)
        }
      }
    }

    OnStopObserving {
      stopObserving()
    }

    OnDestroy {
      stopObserving()
    }
  }

  private fun stopObserving() {
    val removed = synchronized(registrationLock) {
      registration.also { registration = null }
    }
    removed?.remove()
  }

  private companion object {
    const val INTERRUPTION = "interruption"
    const val ROUTE_CHANGE = "routeChange"
    const val ACTIVATION_ERROR = "activationError"
    const val NOW_PLAYING_OWNER_CHANGE = "nowPlayingOwnerChange"
  }
}
