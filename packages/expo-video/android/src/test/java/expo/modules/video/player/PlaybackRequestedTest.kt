package expo.modules.video.player

import androidx.media3.common.Player
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaybackRequestedTest {
  @Test
  fun `playback is requested while the player is ready`() {
    assertTrue(isPlaybackRequestedFor(playWhenReady = true, playbackState = Player.STATE_READY))
  }

  @Test
  fun `playback stays requested while the player buffers`() {
    assertTrue(isPlaybackRequestedFor(playWhenReady = true, playbackState = Player.STATE_BUFFERING))
  }

  @Test
  fun `playback is not requested while the player is paused`() {
    assertFalse(isPlaybackRequestedFor(playWhenReady = false, playbackState = Player.STATE_READY))
  }

  @Test
  fun `playback is not requested after the player ended`() {
    assertFalse(isPlaybackRequestedFor(playWhenReady = true, playbackState = Player.STATE_ENDED))
  }

  @Test
  fun `playback is not requested while the player is idle`() {
    assertFalse(isPlaybackRequestedFor(playWhenReady = true, playbackState = Player.STATE_IDLE))
  }
}
