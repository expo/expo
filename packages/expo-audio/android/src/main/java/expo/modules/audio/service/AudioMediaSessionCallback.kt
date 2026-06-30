package expo.modules.audio.service

import android.os.Bundle
import androidx.annotation.OptIn
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

@OptIn(UnstableApi::class)
class AudioMediaSessionCallback(
  private val service: AudioControlsService
) : MediaSession.Callback {
  override fun onConnect(
    session: MediaSession,
    controller: MediaSession.ControllerInfo
  ): MediaSession.ConnectionResult {
    try {
      val availablePlayerCommands = MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS.buildUpon()
        .add(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM)
        .add(Player.COMMAND_SEEK_FORWARD)
        .add(Player.COMMAND_SEEK_BACK)
        .apply {
          if (service.supportsPreviousTrack()) {
            add(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)
            add(Player.COMMAND_SEEK_TO_PREVIOUS)
          }
          if (service.supportsNextTrack()) {
            add(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)
            add(Player.COMMAND_SEEK_TO_NEXT)
          }
        }
        .build()

      val availableSessionCommands = MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
        .add(SessionCommand(AudioControlsService.ACTION_SEEK_BACKWARD, Bundle.EMPTY))
        .add(SessionCommand(AudioControlsService.ACTION_SEEK_FORWARD, Bundle.EMPTY))
        .apply {
          if (service.supportsPreviousTrack()) {
            add(SessionCommand(AudioControlsService.ACTION_PREVIOUS_TRACK, Bundle.EMPTY))
          }
          if (service.supportsNextTrack()) {
            add(SessionCommand(AudioControlsService.ACTION_NEXT_TRACK, Bundle.EMPTY))
          }
        }
        .build()

      return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
        .setAvailablePlayerCommands(availablePlayerCommands)
        .setAvailableSessionCommands(availableSessionCommands)
        .build()
    } catch (e: Exception) {
      return MediaSession.ConnectionResult.reject()
    }
  }

  override fun onCustomCommand(
    session: MediaSession,
    controller: MediaSession.ControllerInfo,
    command: SessionCommand,
    args: Bundle
  ): ListenableFuture<SessionResult> {
    return when (command.customAction) {
      AudioControlsService.ACTION_SEEK_FORWARD -> {
        service.seekForward()
        Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
      }
      AudioControlsService.ACTION_SEEK_BACKWARD -> {
        service.seekBackward()
        Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
      }
      AudioControlsService.ACTION_NEXT_TRACK -> {
        service.nextTrack()
        Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
      }
      AudioControlsService.ACTION_PREVIOUS_TRACK -> {
        service.previousTrack()
        Futures.immediateFuture(SessionResult(SessionResult.RESULT_SUCCESS))
      }
      else -> super.onCustomCommand(session, controller, command, args)
    }
  }
}
