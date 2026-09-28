package expo.modules.audio

import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi

// A media session calls `play()` on its player directly. Routing it to `onPlay` lets playback
// started from the lock screen or a media button request audio focus, like playback started in JS.
@UnstableApi
internal class PlayRequestingPlayer(
  player: Player,
  private val onPlay: () -> Unit
) : ForwardingPlayer(player) {
  override fun play() = onPlay()
}
