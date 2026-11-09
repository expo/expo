package expo.modules.mediasession

import java.lang.ref.WeakReference
import java.util.Objects

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

internal class NowPlayingCenterState(
  val info: NowPlayingInfo,
  val mediaType: NowPlayingMediaType,
  val isPlaying: Boolean,
  val commands: Set<RemoteCommandKind>
) {
  override fun equals(other: Any?) =
    other is NowPlayingCenterState &&
      other.info == info &&
      other.mediaType == mediaType &&
      other.isPlaying == isPlaying &&
      other.commands == commands

  override fun hashCode() = Objects.hash(info, mediaType, isPlaying, commands)

  override fun toString() =
    "NowPlayingCenterState(info=$info, mediaType=${mediaType.raw}, isPlaying=$isPlaying, " +
      "commands=${commands.map { it.raw }})"
}

internal interface NowPlayingCenterBackend {
  fun apply(state: NowPlayingCenterState?)
}

/** Confined to the coordinator thread. */
internal class NowPlayingStack(
  private val center: NowPlayingCenterBackend,
  private val mixingMode: () -> InterruptionMode,
  private val onOwnerChange: (String?) -> Unit = {}
) {
  private class Entry(
    val claimId: Long,
    val owner: WeakReference<NowPlayingOwner>,
    var info: NowPlayingInfo,
    var commands: Set<RemoteCommandKind>
  ) {
    var pausedByTakeover = false
    var wasPlaying = false
  }

  private val entries = mutableListOf<Entry>()
  private var nextClaimId = 0L
  private var applied: NowPlayingCenterState? = null

  var ownerId: String? = null
    private set

  fun offer(owner: NowPlayingOwner, info: NowPlayingInfo, commands: Set<RemoteCommandKind>): Long {
    val claimId = ++nextClaimId
    settleTop()
    val top = entries.lastOrNull()
    val previous = top?.owner?.get()
    if (top != null && previous != null && previous !== owner && previous.isPlaying &&
      mixingMode() != InterruptionMode.MIX_WITH_OTHERS
    ) {
      top.pausedByTakeover = true
      top.wasPlaying = true
      previous.pauseForTakeover()
    }
    entries.removeAll { it.owner.get() === owner }
    entries.add(Entry(claimId, WeakReference(owner), info, commands))
    publish()
    return claimId
  }

  fun update(claimId: Long, info: NowPlayingInfo, commands: Set<RemoteCommandKind>? = null) {
    settleTop()
    val entry = entries.firstOrNull { it.claimId == claimId } ?: return
    entry.info = info
    commands?.let { entry.commands = it }
    if (entry.pausedByTakeover) {
      val isPlaying = entry.owner.get()?.isPlaying == true
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
    entries.removeAll { it.claimId == claimId }
    settleTop()
    publish()
  }

  fun handle(command: RemoteCommand) {
    settleTop()
    publish()
    val top = entries.lastOrNull() ?: return
    val owner = top.owner.get() ?: return
    if (command.kind in commandsOf(top)) {
      owner.handle(command)
    }
  }

  private fun settleTop() {
    entries.removeAll { it.owner.get() == null }
    val top = entries.lastOrNull() ?: return
    val owner = top.owner.get() ?: return
    if (top.pausedByTakeover) {
      top.pausedByTakeover = false
      owner.resumeAfterTakeover()
    }
  }

  private fun publish(force: Boolean = false) {
    val top = entries.lastOrNull()
    val owner = top?.owner?.get()
    val id = owner?.nowPlayingId
    if (id != ownerId) {
      ownerId = id
      onOwnerChange(id)
    }
    val state = if (top != null && owner != null) {
      NowPlayingCenterState(top.info, owner.mediaType, owner.isPlaying, commandsOf(top))
    } else {
      null
    }
    if (force || state != applied) {
      applied = state
      center.apply(state)
    }
  }

  private fun commandsOf(entry: Entry) =
    if (entry.info.isLiveStream) {
      entry.commands - RemoteCommandKind.SEEK
    } else {
      entry.commands
    }
}
