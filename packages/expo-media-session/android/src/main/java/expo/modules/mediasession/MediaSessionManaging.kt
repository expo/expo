package expo.modules.mediasession

import android.os.Handler
import android.os.Looper
import java.util.concurrent.Executor

interface MediaSessionManaging {
  val policy: AudioPolicy
  val nowPlayingOwner: NowPlayingOwner?

  fun beginUse(
    client: String,
    requirements: SessionRequirements = SessionRequirements(),
    delegate: SessionUseDelegate? = null,
    executor: Executor = MainThreadExecutor
  ): SessionUse

  fun hold(client: String): SessionHold

  fun setPolicy(update: AudioPolicyUpdate)

  fun suspendWrites(reason: String)

  fun resumeWrites()

  /** Begin the owner's session use first. */
  fun offerNowPlaying(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): NowPlayingClaim

  fun addObserver(observer: MediaSessionObserver): ObserverRegistration
}

/** Keep a reference and close it when playback stops. */
interface SessionUse : AutoCloseable {
  suspend fun awaitActivation()

  fun update(requirements: SessionRequirements)

  fun end()

  override fun close() = end()
}

/** Keep a reference and close it when it is no longer needed. */
interface SessionHold : AutoCloseable {
  suspend fun awaitActivation()

  fun release()

  override fun close() = release()
}

/** Keep a reference while the owner shows on the lock screen, and close it when the owner stops. */
interface NowPlayingClaim : AutoCloseable {
  fun update(info: NowPlayingInfo, commands: Set<RemoteCommandKind>? = null)

  fun withdraw()

  override fun close() = withdraw()
}

/** The manager keeps the observer until [remove] or [close] is called. */
interface ObserverRegistration : AutoCloseable {
  fun remove()

  override fun close() = remove()
}

internal object MainThreadExecutor : Executor {
  private val handler by lazy { Handler(Looper.getMainLooper()) }

  override fun execute(command: Runnable) {
    handler.post(command)
  }
}
