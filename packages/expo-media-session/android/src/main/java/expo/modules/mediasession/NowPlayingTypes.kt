package expo.modules.mediasession

import android.os.Build
import androidx.annotation.RequiresApi
import androidx.media3.common.Player
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
  val artworkData: ByteArray? = null,
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
    artworkData: ByteArray? = this.artworkData,
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
    artworkData = artworkData,
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

  override fun equals(other: Any?) =
    other is NowPlayingInfo && other.fields == fields && other.artworkData.contentEquals(artworkData)

  override fun hashCode() = Objects.hash(fields, artworkData.contentHashCode())

  override fun toString() =
    "NowPlayingInfo(title=$title, artist=$artist, album=$album, artworkUrl=$artworkUrl, " +
      "artworkData=${artworkData?.size?.let { "$it bytes" }}, duration=$duration, " +
      "elapsedTime=$elapsedTime, playbackRate=$playbackRate, isLiveStream=$isLiveStream, queueIndex=$queueIndex, " +
      "queueCount=$queueCount, skipForwardInterval=$skipForwardInterval, skipBackwardInterval=$skipBackwardInterval)"
}

/** Called on the coordinator thread. */
interface NowPlayingOwner {
  val mediaType: NowPlayingMediaType
  val isPlaying: Boolean

  fun handle(command: RemoteCommand)

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

internal class ManagerNowPlayingClaim(val id: Long, manager: MediaSessionManager) : NowPlayingClaim {
  private val manager = WeakReference(manager)
  private val withdrawn = AtomicBoolean(false)
  private val release = ClaimRelease(id, this.manager, withdrawn)
  private val finalizeGuardian: Any? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    ClaimCleaner.cleaner.register(this, release)
    null
  } else {
    FinalizeGuardian(release)
  }

  override fun update(info: NowPlayingInfo, commands: Set<RemoteCommandKind>?) {
    if (!withdrawn.get()) {
      manager.get()?.updateNowPlaying(id, info, commands?.toSet())
    }
  }

  override fun withdraw() {
    if (withdrawn.compareAndSet(false, true)) {
      manager.get()?.withdrawNowPlaying(id)
    }
  }
}

// Runs on the Cleaner or finalizer thread; it must not reference the claim.
private class ClaimRelease(
  private val id: Long,
  private val manager: WeakReference<MediaSessionManager>,
  private val withdrawn: AtomicBoolean
) : Runnable {
  override fun run() {
    if (withdrawn.compareAndSet(false, true)) {
      manager.get()?.withdrawNowPlaying(id)
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
