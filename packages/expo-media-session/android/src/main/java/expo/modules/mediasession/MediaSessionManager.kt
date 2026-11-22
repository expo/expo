package expo.modules.mediasession

import android.content.Context
import expo.modules.kotlin.exception.CodedException
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineDispatcher

class MediaSessionException(message: String, cause: Throwable? = null) : CodedException(message, cause)

class SessionUseEndedException(client: String) : CodedException(
  "$client awaited activation after its use of the media session ended. " +
    "Await activation before ending the use, or begin a new use"
)

/** Called on the coordinator thread. */
interface MediaSessionObserver {
  fun mediaSessionDidFail(error: CodedException, client: String) {}

  fun mediaSessionDidSuspendWrites(reason: String) {}

  fun mediaSessionDidResumeWrites() {}
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

class MediaSessionManager internal constructor(backend: SessionBackend, dispatcher: CoroutineDispatcher) {
  internal val coordinator = SessionCoordinator(backend, dispatcher)

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

  fun addObserver(observer: MediaSessionObserver): ObserverRegistration = coordinator.addObserver(observer)

  companion object {
    @Volatile
    private var instance: MediaSessionManager? = null

    fun get(context: Context): MediaSessionManager =
      instance ?: synchronized(this) {
        instance ?: create(context.applicationContext).also { instance = it }
      }

    private fun create(context: Context): MediaSessionManager {
      val scheduler = HandlerScheduler()
      return MediaSessionManager(AudioManagerBackend(context, scheduler.handler), scheduler.dispatcher)
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
