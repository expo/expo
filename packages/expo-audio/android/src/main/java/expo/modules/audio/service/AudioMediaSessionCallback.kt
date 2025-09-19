package expo.modules.audio.service

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession

class AudioMediaSessionCallback : MediaSession.Callback {
  @OptIn(UnstableApi::class)
  override fun onConnect(
    session: MediaSession,
    controller: MediaSession.ControllerInfo
  ): MediaSession.ConnectionResult {
    return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
      .setAvailablePlayerCommands(
        MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS
      ).build()
  }
}
