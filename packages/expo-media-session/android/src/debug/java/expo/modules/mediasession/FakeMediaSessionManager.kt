package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException
import java.lang.ref.WeakReference
import java.util.concurrent.Executor
import java.util.concurrent.atomic.AtomicReference

class FakeMediaSessionManager : MediaSessionManaging {
  class Use internal constructor(
    val client: String,
    requirements: SessionRequirements,
    delegate: SessionUseDelegate?,
    val executor: Executor,
    private val activationError: CodedException?
  ) : SessionUse {
    private val delegateReference = delegate?.let { WeakReference(it) }

    @Volatile
    var requirements: SessionRequirements = requirements
      private set

    @Volatile
    var isEndedByClient = false
      private set

    @Volatile
    var isEndedByModule = false
      private set

    val delegate: SessionUseDelegate?
      get() = delegateReference?.get()

    override suspend fun awaitActivation() {
      activationError?.let { throw it }
      if (isEndedByClient || isEndedByModule) {
        throw SessionUseEndedException(client)
      }
    }

    override fun update(requirements: SessionRequirements) {
      if (!isEndedByClient && !isEndedByModule) {
        this.requirements = requirements
      }
    }

    override fun end() {
      isEndedByClient = true
    }

    fun pause(reason: SessionPauseReason) = send { it.sessionUsePause(this, reason) }

    fun resume() = send { it.sessionUseResume(this) }

    fun duck(isDucked: Boolean) = send { it.sessionUseDuck(this, isDucked) }

    fun fail(error: CodedException) = send { it.sessionUseDidFail(this, error) }

    fun endByModule(reason: SessionPauseReason? = null) {
      if (isEndedByClient || isEndedByModule) {
        return
      }
      isEndedByModule = true
      reason?.let { pause(it) }
      send { it.sessionUseDidEnd(this) }
    }

    fun endByModule(error: CodedException) {
      if (isEndedByClient || isEndedByModule) {
        return
      }
      isEndedByModule = true
      fail(error)
      send { it.sessionUseDidEnd(this) }
    }

    private fun send(body: (SessionUseDelegate) -> Unit) {
      if (delegateReference == null) {
        return
      }
      executor.execute {
        if (!isEndedByClient) {
          delegate?.let(body)
        }
      }
    }
  }

  class Hold internal constructor(val client: String) : SessionHold {
    @Volatile
    var isReleased = false
      private set

    override suspend fun awaitActivation() {
      if (isReleased) {
        throw SessionUseEndedException(client)
      }
    }

    override fun release() {
      isReleased = true
    }
  }

  private val begunUses = mutableListOf<Use>()
  private val takenHolds = mutableListOf<Hold>()
  private val activationError = AtomicReference<CodedException?>(null)

  @Volatile
  override var policy: AudioPolicy = AudioPolicy.DEFAULT
    private set

  override val nowPlayingOwner: NowPlayingOwner? = null

  val uses: List<Use>
    get() = synchronized(begunUses) { begunUses.toList() }

  val holds: List<Hold>
    get() = synchronized(takenHolds) { takenHolds.toList() }

  fun failNextActivation(error: CodedException) {
    activationError.set(error)
  }

  override fun beginUse(
    client: String,
    requirements: SessionRequirements,
    delegate: SessionUseDelegate?,
    executor: Executor
  ): SessionUse {
    val error = activationError.getAndSet(null)
    val use = Use(client, requirements, delegate, executor, error)
    synchronized(begunUses) { begunUses.add(use) }
    error?.let { use.endByModule(it) }
    return use
  }

  override fun hold(client: String): SessionHold = Hold(client).also {
    synchronized(takenHolds) { takenHolds.add(it) }
  }

  @Synchronized
  override fun setPolicy(update: AudioPolicyUpdate) {
    policy = policy.merged(update)
  }

  override fun suspendWrites(reason: String) {}

  override fun resumeWrites() {}

  override fun offerNowPlaying(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ): NowPlayingClaim = object : NowPlayingClaim {
    override fun update(info: NowPlayingInfo, commands: Set<RemoteCommandKind>?) {}

    override fun withdraw() {}
  }

  override fun addObserver(observer: MediaSessionObserver): ObserverRegistration = object : ObserverRegistration {
    override fun remove() {}
  }
}
