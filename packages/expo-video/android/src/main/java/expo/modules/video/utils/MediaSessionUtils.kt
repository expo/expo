package expo.modules.video.utils

import android.content.Context
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession

/**
 * Creates a basic foreground media session, for receiving commands like play/pause from bluetooth devices.
 */
internal fun buildBasicMediaSession(context: Context, player: ExoPlayer): MediaSession {
  return MediaSession.Builder(context, player)
    .setId("ExpoVideoBasicMediaSession_${player.hashCode()}")
    .build()
}
