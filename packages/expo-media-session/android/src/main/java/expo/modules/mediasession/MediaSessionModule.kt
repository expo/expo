package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.react.androidContextOrNull

private const val INTERRUPTION = "interruption"
private const val ROUTE_CHANGE = "routeChange"
private const val ACTIVATION_ERROR = "activationError"
private const val NOW_PLAYING_OWNER_CHANGE = "nowPlayingOwnerChange"

@Record
internal data class InterruptionEvent(
  val type: String,
  val reason: String? = null,
  val shouldResume: Boolean? = null
)

@Record
internal data class RouteChangeEvent(val reason: String)

@Record
internal data class ActivationErrorEvent(val message: String?, val client: String)

@ExpoModule("ExpoMediaSession")
class MediaSessionModule : Module() {
  private val listeningLock = Any()
  private val listening = mutableSetOf<String>()
  private var registration: ObserverRegistration? = null

  @Event(name = INTERRUPTION)
  private val onInterruption = event<InterruptionEvent>(
    onStartObserving = { startObserving(INTERRUPTION) },
    onStopObserving = { stopObserving(INTERRUPTION) }
  )

  @Event(name = ROUTE_CHANGE)
  private val onRouteChange = event<RouteChangeEvent>(
    onStartObserving = { startObserving(ROUTE_CHANGE) },
    onStopObserving = { stopObserving(ROUTE_CHANGE) }
  )

  @Event(name = ACTIVATION_ERROR)
  private val onActivationError = event<ActivationErrorEvent>(
    onStartObserving = { startObserving(ACTIVATION_ERROR) },
    onStopObserving = { stopObserving(ACTIVATION_ERROR) }
  )

  @Event(name = NOW_PLAYING_OWNER_CHANGE)
  private val onNowPlayingOwnerChange = event<Unit>(
    onStartObserving = { startObserving(NOW_PLAYING_OWNER_CHANGE) },
    onStopObserving = { stopObserving(NOW_PLAYING_OWNER_CHANGE) }
  )

  private val forwarder = object : MediaSessionObserver {
    override fun mediaSessionInterruptionBegan(reason: InterruptionReason) {
      onInterruption(InterruptionEvent(type = "began", reason = reason.raw))
    }

    override fun mediaSessionInterruptionEnded(shouldResume: Boolean) {
      onInterruption(InterruptionEvent(type = "ended", shouldResume = shouldResume))
    }

    override fun mediaSessionRouteChanged(reason: RouteChangeReason) {
      onRouteChange(RouteChangeEvent(reason.raw))
    }

    override fun mediaSessionDidFail(error: CodedException, client: String) {
      val message = error.cause?.message?.let { "${error.message}\n→ Caused by: $it" } ?: error.message
      onActivationError(ActivationErrorEvent(message, client))
    }

    override fun mediaSessionNowPlayingOwnerChanged(owner: NowPlayingOwner?) {
      onNowPlayingOwnerChange(Unit)
    }
  }

  override fun onDestroy() {
    val removed = synchronized(listeningLock) {
      listening.clear()
      registration.also { registration = null }
    }
    removed?.remove()
  }

  private fun startObserving(event: String) {
    val context = androidContextOrNull ?: return
    synchronized(listeningLock) {
      listening.add(event)
      if (registration == null) {
        registration = MediaSessionManager.get(context).addObserver(forwarder)
      }
    }
  }

  private fun stopObserving(event: String) {
    val removed = synchronized(listeningLock) {
      listening.remove(event)
      if (listening.isEmpty()) {
        registration.also { registration = null }
      } else {
        null
      }
    }
    removed?.remove()
  }
}
