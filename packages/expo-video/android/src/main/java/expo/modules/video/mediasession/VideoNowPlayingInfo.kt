package expo.modules.video.mediasession

import expo.modules.mediasession.NowPlayingInfo
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind

internal object VideoNowPlaying {
  const val SKIP_INTERVAL_SECONDS = 10.0

  val commands = setOf(
    RemoteCommandKind.PLAY,
    RemoteCommandKind.PAUSE,
    RemoteCommandKind.TOGGLE_PLAY_PAUSE,
    RemoteCommandKind.SEEK,
    RemoteCommandKind.SKIP_FORWARD,
    RemoteCommandKind.SKIP_BACKWARD
  )

  fun info(
    title: String? = null,
    artist: String? = null,
    artworkUrl: String? = null,
    isLive: Boolean = false
  ) = NowPlayingInfo(
    title = title,
    artist = artist,
    artworkUrl = artworkUrl,
    isLiveStream = isLive,
    skipForwardInterval = SKIP_INTERVAL_SECONDS,
    skipBackwardInterval = SKIP_INTERVAL_SECONDS
  )

  /**
   * Returns the position in milliseconds that a seek or a skip command moves the player to, or `null` for other commands.
   */
  fun seekTargetMs(command: RemoteCommand, currentPositionMs: Long): Long? {
    val seconds = when (command.kind) {
      RemoteCommandKind.SEEK -> command.value ?: return null
      RemoteCommandKind.SKIP_FORWARD -> currentPositionMs / 1000.0 + (command.value ?: SKIP_INTERVAL_SECONDS)
      RemoteCommandKind.SKIP_BACKWARD -> currentPositionMs / 1000.0 - (command.value ?: SKIP_INTERVAL_SECONDS)
      else -> return null
    }
    return (seconds * 1000).toLong().coerceAtLeast(0)
  }
}
