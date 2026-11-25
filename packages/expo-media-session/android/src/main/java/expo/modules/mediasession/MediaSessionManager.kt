package expo.modules.mediasession

import android.app.Application
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
import java.util.concurrent.Executor
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

  fun mediaSessionNowPlayingOwnerChanged(owner: NowPlayingOwner?) {}
}

internal class CoordinatorObserverRegistration(private val onRemove: () -> Unit) : ObserverRegistration {
  private val removed = AtomicBoolean(false)

  override fun remove() {
    if (removed.compareAndSet(false, true)) {
      onRemove()
    }
  }
}

class MediaSessionManager internal constructor(
  backend: SessionBackend,
  dispatcher: CoroutineDispatcher,
  nowPlayingCenter: NowPlayingCenterBackend = DetachedNowPlayingCenter,
  checkThread: () -> Unit = {}
) : MediaSessionManaging {
  internal val coordinator = SessionCoordinator(backend, dispatcher)
  private var systemEvents: SystemEventSource? = null
  private var appVisibility: AppVisibilitySource? = null
  private val nowPlaying = NowPlayingStack(
    nowPlayingCenter,
    mixingMode = { coordinator.effectiveInterruptionMode },
    isInterrupted = { coordinator.isInterrupted },
    onOwnerChange = { owner -> coordinator.notify { it.mediaSessionNowPlayingOwnerChanged(owner) } },
    checkThread = checkThread,
    log = { coordinator.log(it) }
  )

  init {
    coordinator.onTask = nowPlaying::prune
    coordinator.addObserver(object : MediaSessionObserver {
      override fun mediaSessionInterruptionEnded(shouldResume: Boolean) = nowPlaying.interruptionEnded(shouldResume)
    })
    nowPlayingCenter.setCommandHandler { command ->
      coordinator.post { nowPlaying.handle(command) }
    }
    nowPlayingCenter.setFailureHandler { error ->
      coordinator.post {
        coordinator.notify { it.mediaSessionDidFail(error, "Now Playing") }
      }
    }
  }

  override val policy: AudioPolicy
    get() = coordinator.policy

  override fun beginUse(
    client: String,
    requirements: SessionRequirements,
    delegate: SessionUseDelegate?,
    executor: Executor
  ): SessionUse {
    val activation = CompletableDeferred<Unit>()
    val use = CoordinatorSessionUse(coordinator.nextId(), client, activation, coordinator)
    coordinator.begin(use.id, client, requirements, activation, use, delegate, executor)
    return use
  }

  override fun hold(client: String): SessionHold {
    val activation = CompletableDeferred<Unit>()
    val hold = CoordinatorSessionHold(coordinator.nextId(), client, activation, coordinator)
    coordinator.begin(hold.id, client, SessionRequirements(), activation, hold, delegate = null, executor = MainThreadExecutor)
    return hold
  }

  override fun suspendWrites(reason: String) {
    coordinator.suspendWrites(reason)
  }

  override fun resumeWrites() {
    coordinator.resumeWrites()
  }

  override fun setPolicy(update: AudioPolicyUpdate) {
    coordinator.setPolicy(update)
  }

  override fun offerNowPlaying(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ): NowPlayingClaim {
    val claim = ManagerNowPlayingClaim(coordinator.nextId(), this)
    val offered = commands.toSet()
    coordinator.post { nowPlaying.offer(owner, info, offered, claim.id, claim) }
    return claim
  }

  override val nowPlayingOwner: NowPlayingOwner?
    get() = nowPlaying.owner

  override fun addObserver(observer: MediaSessionObserver): ObserverRegistration = coordinator.addObserver(observer)

  internal fun updateNowPlaying(id: Long, info: NowPlayingInfo, commands: Set<RemoteCommandKind>?) {
    coordinator.post { nowPlaying.update(id, info, commands) }
  }

  internal fun withdrawNowPlaying(id: Long) {
    coordinator.post { nowPlaying.withdraw(id) }
  }

  @VisibleForTesting
  internal fun clearNowPlayingClaimReference(claim: ManagerNowPlayingClaim) {
    coordinator.post { nowPlaying.clearClaimReference(claim.id) }
  }

  @VisibleForTesting
  internal fun close() {
    appVisibility?.stop()
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
        appVisibility = (context as? Application)?.let { application ->
          AppVisibilitySource(application, coordinator).also { it.start() }
        }
      }
    }
  }
}

internal class CoordinatorSessionUse(
  val id: Long,
  private val client: String,
  val activation: CompletableDeferred<Unit>,
  coordinator: SessionCoordinator
) : SessionUse {
  private val coordinator = WeakReference(coordinator)
  private val endedByClient = AtomicBoolean(false)
  private val endedByModule = AtomicBoolean(false)

  val isEndedByClient: Boolean
    get() = endedByClient.get()

  private val isEnded: Boolean
    get() = endedByClient.get() || endedByModule.get()

  override suspend fun awaitActivation() {
    if (isEnded) {
      throw SessionUseEndedException(client)
    }
    activation.await()
  }

  override fun update(requirements: SessionRequirements) {
    if (!isEnded) {
      coordinator.get()?.update(id, requirements)
    }
  }

  override fun end() {
    if (endedByClient.compareAndSet(false, true)) {
      activation.completeExceptionally(SessionUseEndedException(client))
      if (!endedByModule.get()) {
        coordinator.get()?.end(id)
      }
    }
  }

  fun markEndedByModule() {
    endedByModule.set(true)
  }
}

internal class CoordinatorSessionHold(
  val id: Long,
  private val client: String,
  val activation: CompletableDeferred<Unit>,
  coordinator: SessionCoordinator
) : SessionHold {
  private val coordinator = WeakReference(coordinator)
  private val released = AtomicBoolean(false)

  override suspend fun awaitActivation() {
    if (released.get()) {
      throw SessionUseEndedException(client)
    }
    activation.await()
  }

  override fun release() {
    if (released.compareAndSet(false, true)) {
      activation.completeExceptionally(SessionUseEndedException(client))
      coordinator.get()?.end(id)
    }
  }
}
