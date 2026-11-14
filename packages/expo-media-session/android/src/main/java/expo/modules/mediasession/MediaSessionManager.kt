package expo.modules.mediasession

import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Handler
import android.os.Looper
import androidx.annotation.VisibleForTesting
import expo.modules.kotlin.exception.CodedException
import expo.modules.mediasession.service.Media3SessionFactory
import expo.modules.mediasession.service.MediaPlaybackServiceLogic
import expo.modules.mediasession.service.NowPlayingSessionCenter
import expo.modules.mediasession.service.ServiceConnector
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineDispatcher

class MediaSessionException(message: String, cause: Throwable? = null) : CodedException(message, cause)

class SessionUseEndedException(client: String) : CodedException(
  "$client awaited activation after its use of the media session ended. " +
    "Await activation before ending the use, or begin a new use"
)

@JvmInline
value class RouteChangeReason private constructor(val raw: String) {
  companion object {
    val OLD_DEVICE_UNAVAILABLE = RouteChangeReason("oldDeviceUnavailable")
    val NEW_DEVICE_AVAILABLE = RouteChangeReason("newDeviceAvailable")
    val CATEGORY_CHANGE = RouteChangeReason("categoryChange")
    val OTHER = RouteChangeReason("other")
  }
}

@JvmInline
value class InterruptionReason private constructor(val raw: String) {
  companion object {
    val DEFAULT = InterruptionReason("default")
    val ROUTE_DISCONNECTED = InterruptionReason("routeDisconnected")
    val BUILT_IN_MIC_MUTED = InterruptionReason("builtInMicMuted")
  }
}

/** Called on the coordinator thread. */
interface MediaSessionObserver {
  fun mediaSessionDidFail(error: CodedException, client: String) {}

  fun mediaSessionDidSuspendWrites(reason: String) {}

  fun mediaSessionDidResumeWrites() {}

  fun mediaSessionInterruptionBegan(reason: InterruptionReason) {}

  fun mediaSessionInterruptionEnded(shouldResume: Boolean) {}

  fun mediaSessionRouteChanged(reason: RouteChangeReason) {}

  fun mediaSessionDucked(isDucked: Boolean) {}

  fun mediaSessionFocusLost(transient: Boolean) {}

  fun mediaSessionServicesReset() {}

  fun mediaSessionSilentModeChanged(isSilent: Boolean) {}

  fun mediaSessionNowPlayingOwnerChanged(id: String?) {}
}

/** The manager keeps the observer until [remove] or [close] is called. */
class ObserverRegistration internal constructor(private val onRemove: () -> Unit) : AutoCloseable {
  private val removed = AtomicBoolean(false)

  fun remove() {
    if (removed.compareAndSet(false, true)) {
      onRemove()
    }
  }

  override fun close() = remove()
}

class MediaSessionManager internal constructor(
  backend: SessionBackend,
  dispatcher: CoroutineDispatcher,
  nowPlayingCenter: NowPlayingCenterBackend = DetachedNowPlayingCenter,
  checkThread: () -> Unit = {}
) {
  internal val coordinator = SessionCoordinator(backend, dispatcher)
  private var systemEvents: SystemEventSource? = null
  private val nowPlaying = NowPlayingStack(
    nowPlayingCenter,
    mixingMode = { coordinator.effectiveInterruptionMode },
    onOwnerChange = { id -> coordinator.notify { it.mediaSessionNowPlayingOwnerChanged(id) } },
    checkThread = checkThread,
    log = { coordinator.log(it) }
  )

  init {
    coordinator.onTask = nowPlaying::prune
    nowPlayingCenter.setCommandHandler { command ->
      coordinator.post { nowPlaying.handle(command) }
    }
    nowPlayingCenter.setFailureHandler { error ->
      coordinator.post {
        val client = nowPlaying.ownerId ?: "Now Playing"
        coordinator.notify { it.mediaSessionDidFail(error, client) }
      }
    }
  }

  val policy: AudioPolicy
    get() = coordinator.policy

  fun beginUse(client: String, requirements: SessionRequirements = SessionRequirements()): SessionUse {
    val activation = CompletableDeferred<Unit>()
    val use = SessionUse(coordinator.nextId(), client, activation, coordinator)
    coordinator.begin(use.id, client, requirements, activation, use)
    return use
  }

  fun hold(client: String): SessionHold {
    val activation = CompletableDeferred<Unit>()
    val hold = SessionHold(coordinator.nextId(), client, activation, coordinator)
    coordinator.begin(hold.id, client, SessionRequirements(), activation, hold)
    return hold
  }

  fun suspendWrites(reason: String) {
    coordinator.suspendWrites(reason)
  }

  fun resumeWrites() {
    coordinator.resumeWrites()
  }

  fun setPolicy(update: AudioPolicyUpdate) {
    coordinator.setPolicy(update)
  }

  /** Begin the owner's session use first. */
  fun offerNowPlaying(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): NowPlayingClaim {
    val claim = NowPlayingClaim(coordinator.nextId(), this)
    val offered = commands.toSet()
    coordinator.post { nowPlaying.offer(owner, info, offered, claim.id, claim) }
    return claim
  }

  val nowPlayingOwnerId: String?
    get() = nowPlaying.ownerId

  fun addObserver(observer: MediaSessionObserver): ObserverRegistration = coordinator.addObserver(observer)

  internal fun updateNowPlaying(id: Long, info: NowPlayingInfo, commands: Set<RemoteCommandKind>?) {
    coordinator.post { nowPlaying.update(id, info, commands) }
  }

  internal fun withdrawNowPlaying(id: Long, reason: WithdrawReason) {
    coordinator.post { nowPlaying.withdraw(id, reason) }
  }

  @VisibleForTesting
  internal fun clearNowPlayingClaimReference(claim: NowPlayingClaim) {
    coordinator.post { nowPlaying.clearClaimReference(claim.id) }
  }

  @VisibleForTesting
  internal fun close() {
    systemEvents?.stop()
    coordinator.close()
  }

  companion object {
    @Volatile
    private var instance: MediaSessionManager? = null

    fun get(context: Context): MediaSessionManager =
      instance ?: synchronized(this) {
        instance ?: create(context.applicationContext).also { instance = it }
      }

    private fun create(context: Context): MediaSessionManager {
      val scheduler = HandlerScheduler()
      val main = Handler(Looper.getMainLooper())
      val center = NowPlayingSessionCenter(post = { body -> main.post(body) })
      val connector = ServiceConnector(context, onCommand = center::send)
      val sessions = Media3SessionFactory(context, onPlayRequested = { center.logic.onPlayRequested() }, onCommand = center::send)
      center.logic = MediaPlaybackServiceLogic(sessions, connector, center::fail)
      connector.logic = center.logic
      val coordinatorLooper = scheduler.handler.looper
      val checkThread: () -> Unit = if (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
        { check(Looper.myLooper() == coordinatorLooper) { "The Now Playing stack was called off the coordinator thread" } }
      } else {
        {}
      }
      return MediaSessionManager(
        AudioManagerBackend(context, scheduler.handler),
        scheduler.dispatcher,
        center,
        checkThread
      ).apply {
        systemEvents = SystemEventSource(context, scheduler.handler, coordinator).also { it.start() }
      }
    }
  }
}

/** Keep a reference and close it when playback stops. */
class SessionUse internal constructor(
  internal val id: Long,
  private val client: String,
  internal val activation: CompletableDeferred<Unit>,
  coordinator: SessionCoordinator
) : AutoCloseable {
  private val coordinator = WeakReference(coordinator)
  private val ended = AtomicBoolean(false)

  suspend fun awaitActivation() {
    if (ended.get()) {
      throw SessionUseEndedException(client)
    }
    activation.await()
  }

  fun update(requirements: SessionRequirements) {
    if (!ended.get()) {
      coordinator.get()?.update(id, requirements)
    }
  }

  fun end() {
    if (ended.compareAndSet(false, true)) {
      activation.completeExceptionally(SessionUseEndedException(client))
      coordinator.get()?.end(id)
    }
  }

  override fun close() = end()
}

/** Keep a reference and close it when it is no longer needed. */
class SessionHold internal constructor(
  internal val id: Long,
  private val client: String,
  internal val activation: CompletableDeferred<Unit>,
  coordinator: SessionCoordinator
) : AutoCloseable {
  private val coordinator = WeakReference(coordinator)
  private val released = AtomicBoolean(false)

  suspend fun awaitActivation() {
    if (released.get()) {
      throw SessionUseEndedException(client)
    }
    activation.await()
  }

  fun release() {
    if (released.compareAndSet(false, true)) {
      activation.completeExceptionally(SessionUseEndedException(client))
      coordinator.get()?.end(id)
    }
  }

  override fun close() = release()
}
