package expo.modules.mediasession

import android.os.Build
import androidx.annotation.RequiresApi
import androidx.media3.common.Player
import expo.modules.kotlin.exception.CodedException
import java.lang.ref.Cleaner
import java.lang.ref.WeakReference
import java.util.Objects
import java.util.concurrent.atomic.AtomicBoolean

@JvmInline
value class NowPlayingMediaType private constructor(val raw: String) {
  companion object {
    val AUDIO = NowPlayingMediaType("audio")
    val VIDEO = NowPlayingMediaType("video")
  }
}

@JvmInline
value class RemoteCommandKind private constructor(val raw: String) {
  companion object {
    val PLAY = RemoteCommandKind("play")
    val PAUSE = RemoteCommandKind("pause")
    val TOGGLE_PLAY_PAUSE = RemoteCommandKind("togglePlayPause")
    val SEEK = RemoteCommandKind("seek")
    val SKIP_FORWARD = RemoteCommandKind("skipForward")
    val SKIP_BACKWARD = RemoteCommandKind("skipBackward")
    val NEXT_TRACK = RemoteCommandKind("nextTrack")
    val PREVIOUS_TRACK = RemoteCommandKind("previousTrack")
  }
}

@JvmInline
value class WithdrawReason private constructor(val raw: String) {
  companion object {
    val ENDED = WithdrawReason("ended")
    val RELEASED = WithdrawReason("released")
  }
}

class RemoteCommand(
  val kind: RemoteCommandKind,
  val value: Double? = null
) {
  override fun equals(other: Any?) = other is RemoteCommand && other.kind == kind && other.value == value

  override fun hashCode() = Objects.hash(kind, value)

  override fun toString() = "RemoteCommand(kind=${kind.raw}, value=$value)"
}

class NowPlayingInfo(
  val title: String? = null,
  val artist: String? = null,
  val album: String? = null,
  val artworkUrl: String? = null,
  val duration: Double? = null,
  val elapsedTime: Double? = null,
  val playbackRate: Double? = null,
  val isLiveStream: Boolean = false,
  val queueIndex: Int? = null,
  val queueCount: Int? = null,
  val skipForwardInterval: Double? = null,
  val skipBackwardInterval: Double? = null
) {
  fun copy(
    title: String? = this.title,
    artist: String? = this.artist,
    album: String? = this.album,
    artworkUrl: String? = this.artworkUrl,
    duration: Double? = this.duration,
    elapsedTime: Double? = this.elapsedTime,
    playbackRate: Double? = this.playbackRate,
    isLiveStream: Boolean = this.isLiveStream,
    queueIndex: Int? = this.queueIndex,
    queueCount: Int? = this.queueCount,
    skipForwardInterval: Double? = this.skipForwardInterval,
    skipBackwardInterval: Double? = this.skipBackwardInterval
  ) = NowPlayingInfo(
    title = title,
    artist = artist,
    album = album,
    artworkUrl = artworkUrl,
    duration = duration,
    elapsedTime = elapsedTime,
    playbackRate = playbackRate,
    isLiveStream = isLiveStream,
    queueIndex = queueIndex,
    queueCount = queueCount,
    skipForwardInterval = skipForwardInterval,
    skipBackwardInterval = skipBackwardInterval
  )

  private val fields
    get() = listOf(
      title, artist, album, artworkUrl, duration, elapsedTime, playbackRate, isLiveStream, queueIndex, queueCount,
      skipForwardInterval, skipBackwardInterval
    )

  override fun equals(other: Any?) = other is NowPlayingInfo && other.fields == fields

  override fun hashCode() = fields.hashCode()

  override fun toString() =
    "NowPlayingInfo(title=$title, artist=$artist, album=$album, artworkUrl=$artworkUrl, duration=$duration, " +
      "elapsedTime=$elapsedTime, playbackRate=$playbackRate, isLiveStream=$isLiveStream, queueIndex=$queueIndex, " +
      "queueCount=$queueCount, skipForwardInterval=$skipForwardInterval, skipBackwardInterval=$skipBackwardInterval)"
}

/** Called on the coordinator thread. */
interface NowPlayingOwner {
  val nowPlayingId: String
  val mediaType: NowPlayingMediaType
  val isPlaying: Boolean

  fun handle(command: RemoteCommand): Boolean

  fun pauseForTakeover() {
    handle(RemoteCommand(RemoteCommandKind.PAUSE))
  }

  fun resumeAfterTakeover() {
    handle(RemoteCommand(RemoteCommandKind.PLAY))
  }
}

interface MediaPlayerOwner : NowPlayingOwner {
  /** Read on the player's application looper. Keep the same player for the life of the claim. */
  val player: Player
}

/** Keep a reference while the owner shows on the lock screen, and close it when the owner stops. */
class NowPlayingClaim internal constructor(internal val id: Long, manager: MediaSessionManager) : AutoCloseable {
  private val manager = WeakReference(manager)
  private val withdrawn = AtomicBoolean(false)
  private val release = ClaimRelease(id, this.manager, withdrawn)
  private val finalizeGuardian: Any? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    ClaimCleaner.cleaner.register(this, release)
    null
  } else {
    FinalizeGuardian(release)
  }

  fun update(info: NowPlayingInfo, commands: Set<RemoteCommandKind>? = null) {
    if (!withdrawn.get()) {
      manager.get()?.updateNowPlaying(id, info, commands?.toSet())
    }
  }

  fun withdraw(reason: WithdrawReason) {
    if (withdrawn.compareAndSet(false, true)) {
      manager.get()?.withdrawNowPlaying(id, reason)
    }
  }

  override fun close() = withdraw(WithdrawReason.RELEASED)
}

// Runs on the Cleaner or finalizer thread; it must not reference the claim.
private class ClaimRelease(
  private val id: Long,
  private val manager: WeakReference<MediaSessionManager>,
  private val withdrawn: AtomicBoolean
) : Runnable {
  override fun run() {
    if (withdrawn.compareAndSet(false, true)) {
      manager.get()?.withdrawNowPlaying(id, WithdrawReason.RELEASED)
    }
  }
}

private open class FinalizeGuardian(private val release: Runnable) {
  protected fun finalize() = release.run()
}

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private object ClaimCleaner {
  val cleaner: Cleaner = Cleaner.create()
}

internal class NowPlayingCenterState(
  val info: NowPlayingInfo,
  val mediaType: NowPlayingMediaType,
  val isPlaying: Boolean,
  val commands: Set<RemoteCommandKind>,
  owner: NowPlayingOwner? = null
) {
  private val ownerReference = WeakReference(owner)

  val owner: NowPlayingOwner?
    get() = ownerReference.get()

  override fun equals(other: Any?) =
    other is NowPlayingCenterState &&
      other.info == info &&
      other.mediaType == mediaType &&
      other.isPlaying == isPlaying &&
      other.commands == commands &&
      other.owner === owner

  override fun hashCode() = Objects.hash(info, mediaType, isPlaying, commands)

  override fun toString() =
    "NowPlayingCenterState(info=$info, mediaType=${mediaType.raw}, isPlaying=$isPlaying, " +
      "commands=${commands.map { it.raw }})"
}

internal interface NowPlayingCenterBackend {
  fun setCommandHandler(handler: (RemoteCommand) -> Unit)
  fun setFailureHandler(handler: (CodedException) -> Unit)
  fun apply(state: NowPlayingCenterState?)
}

internal object DetachedNowPlayingCenter : NowPlayingCenterBackend {
  override fun setCommandHandler(handler: (RemoteCommand) -> Unit) = Unit

  override fun setFailureHandler(handler: (CodedException) -> Unit) = Unit

  override fun apply(state: NowPlayingCenterState?) = Unit
}

/** Confined to the coordinator thread. */
internal class NowPlayingStack(
  private val center: NowPlayingCenterBackend,
  private val mixingMode: () -> InterruptionMode,
  private val onOwnerChange: (String?) -> Unit = {},
  private val checkThread: () -> Unit = {},
  private val log: (String) -> Unit = {}
) {
  private class Entry(
    val claimId: Long,
    val owner: WeakReference<NowPlayingOwner>,
    val claim: WeakReference<Any>?,
    var info: NowPlayingInfo,
    var commands: Set<RemoteCommandKind>
  ) {
    var pausedByTakeover = false
    var wasPlaying = false

    val isCollected: Boolean
      get() = owner.get() == null || (claim != null && claim.get() == null)
  }

  private val entries = mutableListOf<Entry>()
  private var nextClaimId = 0L
  private var applied: NowPlayingCenterState? = null

  @Volatile
  var ownerId: String? = null
    private set

  fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): Long {
    val claimId = ++nextClaimId
    push(owner, info, commands, claimId, claim = null)
    return claimId
  }

  fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>, claimId: Long, claim: Any) {
    push(owner, info, commands, claimId, WeakReference(claim))
  }

  private fun push(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>,
    claimId: Long,
    claim: WeakReference<Any>?
  ) {
    checkThread()
    settleTop()
    val top = entries.lastOrNull()
    val previous = top?.owner?.get()
    if (top != null && previous != null && previous !== owner && guarded(false) { previous.isPlaying } &&
      mixingMode() != InterruptionMode.MIX_WITH_OTHERS
    ) {
      top.pausedByTakeover = true
      top.wasPlaying = true
      guarded(Unit) { previous.pauseForTakeover() }
    }
    entries.removeAll { it.owner.get() === owner }
    entries.add(Entry(claimId, WeakReference(owner), claim, info, commands))
    publish()
  }

  fun update(claimId: Long, info: NowPlayingInfo, commands: Set<RemoteCommandKind>? = null) {
    checkThread()
    settleTop()
    val entry = entries.firstOrNull { it.claimId == claimId } ?: return
    entry.info = info
    commands?.let { entry.commands = it }
    if (entry.pausedByTakeover) {
      val isPlaying = entry.owner.get()?.let { guarded(false) { it.isPlaying } } == true
      if (isPlaying && !entry.wasPlaying) {
        entry.pausedByTakeover = false
      }
      entry.wasPlaying = isPlaying
    }
    if (entry === entries.last()) {
      publish(force = true)
    }
  }

  fun withdraw(claimId: Long, reason: WithdrawReason) {
    checkThread()
    entries.removeAll { it.claimId == claimId }
    settleTop()
    publish()
  }

  fun handle(command: RemoteCommand) {
    checkThread()
    settleTop()
    publish()
    val top = entries.lastOrNull() ?: return
    val owner = top.owner.get() ?: return
    if (command.kind in commandsOf(top)) {
      guarded(false) { owner.handle(command) }
    }
  }

  fun prune() {
    checkThread()
    if (entries.any { it.isCollected }) {
      settleTop()
      publish()
    }
  }

  fun clearClaimReference(claimId: Long) {
    entries.firstOrNull { it.claimId == claimId }?.claim?.clear()
  }

  private fun settleTop() {
    entries.removeAll { entry ->
      entry.isCollected.also { collected ->
        if (collected && entry.owner.get() != null) {
          val id = entry.owner.get()?.let { guarded(null) { it.nowPlayingId } }
          log("$id did not withdraw its Now Playing claim before it was garbage collected")
        }
      }
    }
    val top = entries.lastOrNull() ?: return
    val owner = top.owner.get() ?: return
    if (top.pausedByTakeover) {
      top.pausedByTakeover = false
      guarded(Unit) { owner.resumeAfterTakeover() }
    }
  }

  private fun publish(force: Boolean = false) {
    val top = entries.lastOrNull()
    val owner = top?.owner?.get()
    val id = owner?.let { guarded(null) { it.nowPlayingId } }
    if (id != ownerId) {
      ownerId = id
      onOwnerChange(id)
    }
    val state = if (top != null && owner != null) {
      NowPlayingCenterState(
        top.info,
        guarded(NowPlayingMediaType.AUDIO) { owner.mediaType },
        guarded(false) { owner.isPlaying },
        commandsOf(top),
        owner
      )
    } else {
      null
    }
    if (force || state != applied) {
      applied = state
      center.apply(state)
    }
  }

  private inline fun <T> guarded(fallback: T, body: () -> T): T =
    try {
      body()
    } catch (e: Exception) {
      log("Now Playing owner failed: $e")
      fallback
    }

  private fun commandsOf(entry: Entry) =
    if (entry.info.isLiveStream) {
      entry.commands - RemoteCommandKind.SEEK
    } else {
      entry.commands
    }
}
