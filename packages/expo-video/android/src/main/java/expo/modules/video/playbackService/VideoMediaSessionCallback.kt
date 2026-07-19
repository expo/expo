package expo.modules.video.playbackService

import android.os.Bundle
import androidx.media3.common.Player
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.google.common.util.concurrent.ListenableFuture
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi

@OptIn(UnstableApi::class)
class VideoMediaSessionCallback : MediaSession.Callback {
  override fun onConnect(
    session: MediaSession,
    controller: MediaSession.ControllerInfo
  ): MediaSession.ConnectionResult {
    try {
      // TODO @behenate: For now we're only allowing seek forward and back by 10 seconds and going to the
      //  beginning of the video. In the future we should add more customization options for the users.
      return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
        .setAvailablePlayerCommands(
          MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS.buildUpon()
            .add(Player.COMMAND_SEEK_FORWARD)
            .add(Player.COMMAND_SEEK_BACK)
            .build()
        )
        .setAvailableSessionCommands(
          MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
            .add(SessionCommand(ExpoVideoPlaybackService.SEEK_BACKWARD_COMMAND, Bundle.EMPTY))
            .add(SessionCommand(ExpoVideoPlaybackService.SEEK_FORWARD_COMMAND, Bundle.EMPTY))
            .build()
        )
        .build()
    } catch (e: Exception) {
      return MediaSession.ConnectionResult.reject()
    }
  }

  override fun onCustomCommand(session: MediaSession, controller: MediaSession.ControllerInfo, customCommand: SessionCommand, args: Bundle): ListenableFuture<SessionResult> {
    when (customCommand.customAction) {
      ExpoVideoPlaybackService.SEEK_FORWARD_COMMAND -> session.player.seekTo(session.player.currentPosition + ExpoVideoPlaybackService.SEEK_INTERVAL_MS)
      ExpoVideoPlaybackService.SEEK_BACKWARD_COMMAND -> session.player.seekTo(session.player.currentPosition - ExpoVideoPlaybackService.SEEK_INTERVAL_MS)
    }
    return super.onCustomCommand(session, controller, customCommand, args)
  }
}
