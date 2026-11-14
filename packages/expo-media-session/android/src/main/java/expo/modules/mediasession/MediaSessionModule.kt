package expo.modules.mediasession

import android.content.Context
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import java.util.Collections
import java.util.WeakHashMap

class MediaSessionModule : Module() {
  private val registrationLock = Any()
  private var registration: ObserverRegistration? = null
  private val holds = mutableMapOf<String, SessionHold>()
  private val owners: MutableSet<JSNowPlayingOwner> = Collections.newSetFromMap(WeakHashMap())

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val manager: MediaSessionManager
    get() = MediaSessionManager.get(context)

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
      val message = error.message
        ?: "$client could not activate the media session for an unknown reason. Check Logcat for the error"
      sendEvent(ACTIVATION_ERROR, mapOf("message" to message, "client" to client))
    }

    override fun mediaSessionNowPlayingOwnerChanged(id: String?) {
      sendEvent(NOW_PLAYING_OWNER_CHANGE, mapOf("id" to id))
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoMediaSession")

    Events(INTERRUPTION, ROUTE_CHANGE, ACTIVATION_ERROR, NOW_PLAYING_OWNER_CHANGE)

    AsyncFunction("setAudioPolicyAsync") { record: AudioPolicyRecord ->
      manager.setPolicy(record.toUpdate())
    }

    Function("getAudioPolicy") {
      AudioPolicyRecord(manager.policy)
    }

    Function("holdSession") { key: String ->
      val hold = manager.hold(key)
      synchronized(holds) { holds.put(key, hold) }?.release()
    }

    Function("releaseSession") { key: String ->
      synchronized(holds) { holds.remove(key) }?.release()
    }

    Function("getNowPlayingOwnerId") {
      manager.nowPlayingOwnerId
    }

    Class("NowPlayingOwner", JSNowPlayingOwner::class) {
      Constructor { id: String, mediaType: String ->
        JSNowPlayingOwner(
          appContext,
          manager,
          id,
          if (mediaType == "video") {
            NowPlayingMediaType.VIDEO
          } else {
            NowPlayingMediaType.AUDIO
          }
        )
          .also { owner -> synchronized(owners) { owners.add(owner) } }
      }

      Function("offer") { owner: JSNowPlayingOwner, info: NowPlayingInfoRecord, commands: List<String>, isPlaying: Boolean ->
        owner.offer(info.toInfo(), commandKinds(commands), isPlaying)
      }

      Function("update") { owner: JSNowPlayingOwner, info: NowPlayingInfoRecord, commands: List<String>?, isPlaying: Boolean ->
        owner.update(info.toInfo(), commands?.let(::commandKinds), isPlaying)
      }

      Function("withdraw") { owner: JSNowPlayingOwner, reason: String ->
        owner.withdraw(
          if (reason == "ended") {
            WithdrawReason.ENDED
          } else {
            WithdrawReason.RELEASED
          }
        )
      }
    }

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
      val released = synchronized(holds) {
        holds.values.toList().also { holds.clear() }
      }
      released.forEach { it.release() }
      val liveOwners = synchronized(owners) {
        owners.toList().also { owners.clear() }
      }
      liveOwners.forEach { it.withdraw(WithdrawReason.RELEASED) }
    }
  }

  private fun stopObserving() {
    val removed = synchronized(registrationLock) {
      registration.also { registration = null }
    }
    removed?.remove()
  }

  private companion object {
    val knownCommandKinds = listOf(
      RemoteCommandKind.PLAY,
      RemoteCommandKind.PAUSE,
      RemoteCommandKind.TOGGLE_PLAY_PAUSE,
      RemoteCommandKind.SEEK,
      RemoteCommandKind.SKIP_FORWARD,
      RemoteCommandKind.SKIP_BACKWARD,
      RemoteCommandKind.NEXT_TRACK,
      RemoteCommandKind.PREVIOUS_TRACK
    ).associateBy { it.raw }

    fun commandKinds(raw: List<String>) = raw.mapNotNull { knownCommandKinds[it] }.toSet()

    const val INTERRUPTION = "interruption"
    const val ROUTE_CHANGE = "routeChange"
    const val ACTIVATION_ERROR = "activationError"
    const val NOW_PLAYING_OWNER_CHANGE = "nowPlayingOwnerChange"
  }
}

@OptimizedRecord
internal class AudioPolicyRecord() : Record {
  @Field
  var playsInSilentMode: Boolean? = null

  @Field
  var interruptionMode: InterruptionMode? = null

  @Field
  var allowsRecording: Boolean? = null

  @Field
  var shouldPlayInBackground: Boolean? = null

  @Field
  var shouldRouteThroughEarpiece: Boolean? = null

  constructor(policy: AudioPolicy) : this() {
    playsInSilentMode = policy.playsInSilentMode
    interruptionMode = policy.interruptionMode
    allowsRecording = policy.allowsRecording
    shouldPlayInBackground = policy.shouldPlayInBackground
    shouldRouteThroughEarpiece = policy.shouldRouteThroughEarpiece
  }

  fun toUpdate() = AudioPolicyUpdate(
    playsInSilentMode = playsInSilentMode,
    interruptionMode = interruptionMode,
    allowsRecording = allowsRecording,
    shouldPlayInBackground = shouldPlayInBackground,
    shouldRouteThroughEarpiece = shouldRouteThroughEarpiece
  )
}

@OptimizedRecord
internal class NowPlayingInfoRecord : Record {
  @Field
  var title: String? = null

  @Field
  var artist: String? = null

  @Field
  var album: String? = null

  @Field
  var artworkUrl: String? = null

  @Field
  var duration: Double? = null

  @Field
  var elapsedTime: Double? = null

  @Field
  var playbackRate: Double? = null

  @Field
  var isLiveStream: Boolean? = null

  @Field
  var queueIndex: Int? = null

  @Field
  var queueCount: Int? = null

  @Field
  var skipForwardInterval: Double? = null

  @Field
  var skipBackwardInterval: Double? = null

  fun toInfo() = NowPlayingInfo(
    title = title,
    artist = artist,
    album = album,
    artworkUrl = artworkUrl,
    duration = duration,
    elapsedTime = elapsedTime,
    playbackRate = playbackRate,
    isLiveStream = isLiveStream ?: false,
    queueIndex = queueIndex,
    queueCount = queueCount,
    skipForwardInterval = skipForwardInterval,
    skipBackwardInterval = skipBackwardInterval
  )
}

internal class JSNowPlayingOwner(
  appContext: AppContext,
  private val manager: MediaSessionManager,
  override val nowPlayingId: String,
  override val mediaType: NowPlayingMediaType
) : SharedObject(appContext), NowPlayingOwner {
  @Volatile
  override var isPlaying: Boolean = false
    private set

  private var claim: NowPlayingClaim? = null

  fun offer(info: NowPlayingInfo, commands: Set<RemoteCommandKind>, isPlaying: Boolean) {
    this.isPlaying = isPlaying
    val offered = manager.offerNowPlaying(this, info, commands)
    val previous = synchronized(this) { claim.also { claim = offered } }
    previous?.withdraw(WithdrawReason.RELEASED)
  }

  fun update(info: NowPlayingInfo, commands: Set<RemoteCommandKind>?, isPlaying: Boolean) {
    this.isPlaying = isPlaying
    synchronized(this) { claim }?.update(info, commands)
  }

  fun withdraw(reason: WithdrawReason) {
    synchronized(this) { claim.also { claim = null } }?.withdraw(reason)
  }

  override fun handle(command: RemoteCommand): Boolean {
    val payload = mutableMapOf<String, Any>("kind" to command.kind.raw)
    command.value?.let { payload["value"] = it }
    emit("command", payload)
    return true
  }

  override fun sharedObjectDidRelease() {
    withdraw(WithdrawReason.RELEASED)
    super.sharedObjectDidRelease()
  }

  override fun pauseForTakeover() {
    emit("pauseForTakeover")
  }

  override fun resumeAfterTakeover() {
    emit("resumeAfterTakeover")
  }
}
