package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.androidContextOrNull
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private const val INTERRUPTION = "interruption"
private const val ROUTE_CHANGE = "routeChange"
private const val ACTIVATION_ERROR = "activationError"
private const val NOW_PLAYING_OWNER_CHANGE = "nowPlayingOwnerChange"

@ExpoModule("ExpoMediaSession", classes = [JSNowPlayingOwner::class, JSSessionUse::class])
class MediaSessionModule : Module() {
  private val listeningLock = Any()
  private val listening = mutableSetOf<String>()
  private var registration: ObserverRegistration? = null
  private val holds = mutableMapOf<String, SessionHold>()

  private val manager: MediaSessionManager
    get() = MediaSessionManager.get(androidContext)

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
      val description = error.message
        ?: "$client could not activate the media session for an unknown reason. Check Logcat for the error"
      val message = error.cause?.message?.let { "$description\n→ Caused by: $it" } ?: description
      onActivationError(ActivationErrorEvent(message, client))
    }

    override fun mediaSessionNowPlayingOwnerChanged(owner: NowPlayingOwner?) {
      onNowPlayingOwnerChange(Unit)
    }
  }

  @JS
  private suspend fun setAudioPolicyAsync(update: AudioPolicyRecord): Unit = withContext(Dispatchers.Default) {
    manager.setPolicy(update.toUpdate())
  }

  @JS
  private fun getAudioPolicy(): AudioPolicyRecord = manager.policy.toRecord()

  @JS
  fun holdSession(key: String) {
    val hold = manager.hold(key)
    synchronized(holds) { holds.put(key, hold) }?.release()
  }

  @JS
  fun releaseSession(key: String) {
    synchronized(holds) { holds.remove(key) }?.release()
  }

  @JS
  private fun beginSessionUse(client: String, requirements: SessionRequirementsRecord): JSSessionUse =
    JSSessionUse(manager, client, requirements.toRequirements())

  @JS
  private fun getNowPlayingOwner(): JSNowPlayingOwner? = manager.nowPlayingOwner as? JSNowPlayingOwner

  @JS
  private fun createNowPlayingOwner(mediaType: String): JSNowPlayingOwner =
    JSNowPlayingOwner(
      manager,
      if (mediaType == "video") {
        NowPlayingMediaType.VIDEO
      } else {
        NowPlayingMediaType.AUDIO
      }
    )

  override fun onDestroy() {
    val removed = synchronized(listeningLock) {
      listening.clear()
      registration.also { registration = null }
    }
    removed?.remove()
    val released = synchronized(holds) {
      holds.values.toList().also { holds.clear() }
    }
    released.forEach { it.release() }
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
