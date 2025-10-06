package expo.modules.audio.playbackService

import android.os.Bundle
import androidx.media3.common.Player
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.ListenableFuture
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.audio.service.AudioControlsService

@OptIn(UnstableApi::class)
class AudioMediaSessionCallback : MediaSession.Callback {
  override fun onConnect(
    session: MediaSession,
    controller: MediaSession.ControllerInfo
  ): MediaSession.ConnectionResult {
    try {
      return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
        .setAvailablePlayerCommands(
          MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS.buildUpon()
            .add(Player.COMMAND_SEEK_FORWARD)
            .add(Player.COMMAND_SEEK_BACK)
            .build()
        )
        .setAvailableSessionCommands(
          MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
            .add(SessionCommand(AudioControlsService.ACTION_SEEK_BACKWARD, Bundle.EMPTY))
            .add(SessionCommand(AudioControlsService.ACTION_SEEK_FORWARD, Bundle.EMPTY))
            .build()
        )
        .build()
    } catch (e: Exception) {
      return MediaSession.ConnectionResult.reject()
    }
  }

  override fun onCustomCommand(session: MediaSession, controller: MediaSession.ControllerInfo, customCommand: SessionCommand, args: Bundle): ListenableFuture<SessionResult> {
    when (customCommand.customAction) {
      AudioControlsService.ACTION_SEEK_FORWARD -> session.player.seekTo(session.player.currentPosition + AudioControlsService.SEEK_INTERVAL_MS)
      AudioControlsService.ACTION_SEEK_BACKWARD -> session.player.seekTo(session.player.currentPosition - AudioControlsService.SEEK_INTERVAL_MS)
    }
    return super.onCustomCommand(session, controller, customCommand, args)
  }
}
