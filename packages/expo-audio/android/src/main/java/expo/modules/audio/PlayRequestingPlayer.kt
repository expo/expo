package expo.modules.audio

import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi

// A media session calls `play()` on its player directly, and a Media3 `MediaController` can also
// start playback with `setPlayWhenReady(true)`. Routing both to `onPlay` lets playback started from
// the lock screen, a media button or another app request audio focus, like playback started in JS.
@UnstableApi
internal class PlayRequestingPlayer(
  player: Player,
  private val onPlay: () -> Unit
) : ForwardingPlayer(player) {
  override fun play() = onPlay()

  override fun setPlayWhenReady(playWhenReady: Boolean) {
    if (playWhenReady) {
      onPlay()
    } else {
      super.setPlayWhenReady(false)
    }
  }
}
