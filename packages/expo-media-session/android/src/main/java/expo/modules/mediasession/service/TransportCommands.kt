package expo.modules.mediasession.service

import androidx.media3.common.Player
import expo.modules.mediasession.NowPlayingInfo
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind

internal enum class TransportButton { PREVIOUS_TRACK, SKIP_BACKWARD, PLAY_PAUSE, NEXT_TRACK, SKIP_FORWARD }

internal class PlaylistShape(val count: Int, val currentIndex: Int)

private const val DEFAULT_SKIP_INTERVAL_SECONDS = 10.0
private const val MINIMUM_SKIP_INTERVAL_SECONDS = 0.1

private val PLAY_PAUSE_KINDS = setOf(RemoteCommandKind.PLAY, RemoteCommandKind.PAUSE, RemoteCommandKind.TOGGLE_PLAY_PAUSE)

private val READ_COMMANDS = intArrayOf(
  Player.COMMAND_GET_CURRENT_MEDIA_ITEM,
  Player.COMMAND_GET_TIMELINE,
  Player.COMMAND_GET_METADATA,
  Player.COMMAND_GET_AUDIO_ATTRIBUTES
)

internal fun skipIntervalSeconds(seconds: Double?): Double {
  val resolved = seconds?.takeIf { it.isFinite() } ?: DEFAULT_SKIP_INTERVAL_SECONDS
  return resolved.coerceAtLeast(MINIMUM_SKIP_INTERVAL_SECONDS)
}

internal fun skipIntervalMs(seconds: Double?): Long = (skipIntervalSeconds(seconds) * 1000).toLong()

internal fun playerCommandSet(kinds: Set<RemoteCommandKind>): Set<Int> = buildSet {
  READ_COMMANDS.forEach(::add)
  if (kinds.any { it in PLAY_PAUSE_KINDS }) {
    add(Player.COMMAND_PLAY_PAUSE)
  }
  if (RemoteCommandKind.SEEK in kinds) {
    add(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM)
  }
  if (RemoteCommandKind.SKIP_FORWARD in kinds) {
    add(Player.COMMAND_SEEK_FORWARD)
  }
  if (RemoteCommandKind.SKIP_BACKWARD in kinds) {
    add(Player.COMMAND_SEEK_BACK)
  }
  if (RemoteCommandKind.NEXT_TRACK in kinds) {
    addAll(listOf(Player.COMMAND_SEEK_TO_NEXT, Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM))
  }
  if (RemoteCommandKind.PREVIOUS_TRACK in kinds) {
    addAll(listOf(Player.COMMAND_SEEK_TO_PREVIOUS, Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM))
  }
}

internal fun playerCommands(kinds: Set<RemoteCommandKind>): Player.Commands =
  Player.Commands.Builder().addAll(*playerCommandSet(kinds).toIntArray()).build()

internal fun playWhenReadyCommand(playWhenReady: Boolean, kinds: Set<RemoteCommandKind>, isPlaying: Boolean): RemoteCommand? {
  val direct = if (playWhenReady) {
    RemoteCommandKind.PLAY
  } else {
    RemoteCommandKind.PAUSE
  }
  return when {
    direct in kinds -> RemoteCommand(direct)
    RemoteCommandKind.TOGGLE_PLAY_PAUSE in kinds && isPlaying != playWhenReady ->
      RemoteCommand(RemoteCommandKind.TOGGLE_PLAY_PAUSE)
    else -> null
  }
}

internal fun seekCommand(seekCommand: Int, positionMs: Long, info: NowPlayingInfo): RemoteCommand? = when (seekCommand) {
  Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM -> RemoteCommand(RemoteCommandKind.SEEK, positionMs.coerceAtLeast(0) / 1000.0)
  Player.COMMAND_SEEK_FORWARD -> RemoteCommand(RemoteCommandKind.SKIP_FORWARD, skipIntervalSeconds(info.skipForwardInterval))
  Player.COMMAND_SEEK_BACK -> RemoteCommand(RemoteCommandKind.SKIP_BACKWARD, skipIntervalSeconds(info.skipBackwardInterval))
  Player.COMMAND_SEEK_TO_NEXT, Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM -> RemoteCommand(RemoteCommandKind.NEXT_TRACK)
  Player.COMMAND_SEEK_TO_PREVIOUS, Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM ->
    RemoteCommand(RemoteCommandKind.PREVIOUS_TRACK)
  else -> null
}

internal fun transportLayout(kinds: Set<RemoteCommandKind>): List<TransportButton> = listOfNotNull(
  when {
    RemoteCommandKind.PREVIOUS_TRACK in kinds -> TransportButton.PREVIOUS_TRACK
    RemoteCommandKind.SKIP_BACKWARD in kinds -> TransportButton.SKIP_BACKWARD
    else -> null
  },
  TransportButton.PLAY_PAUSE.takeIf { kinds.any { it in PLAY_PAUSE_KINDS } },
  when {
    RemoteCommandKind.NEXT_TRACK in kinds -> TransportButton.NEXT_TRACK
    RemoteCommandKind.SKIP_FORWARD in kinds -> TransportButton.SKIP_FORWARD
    else -> null
  }
)

internal fun playlistShape(kinds: Set<RemoteCommandKind>): PlaylistShape {
  val previous = if (RemoteCommandKind.PREVIOUS_TRACK in kinds) {
    1
  } else {
    0
  }
  val next = if (RemoteCommandKind.NEXT_TRACK in kinds) {
    1
  } else {
    0
  }
  return PlaylistShape(previous + 1 + next, previous)
}
