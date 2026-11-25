package expo.modules.video.mediasession

import expo.modules.mediasession.NowPlayingInfo
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class VideoNowPlayingInfoTest {
  @Test
  fun `info carries the source metadata`() {
    val info = VideoNowPlaying.info(title = "A", artist = "B", artworkUrl = "https://example.com/a.png")

    assertEquals(
      NowPlayingInfo(
        title = "A",
        artist = "B",
        artworkUrl = "https://example.com/a.png",
        isLiveStream = false,
        skipForwardInterval = 10.0,
        skipBackwardInterval = 10.0
      ),
      info
    )
  }

  @Test
  fun `info without metadata has empty text fields`() {
    val info = VideoNowPlaying.info()

    assertNull(info.title)
    assertNull(info.artist)
    assertNull(info.artworkUrl)
  }

  @Test
  fun `info marks a live stream`() {
    val info = VideoNowPlaying.info(isLive = true)

    assertTrue(info.isLiveStream)
  }

  @Test
  fun `seek goes to the command value`() {
    val target = VideoNowPlaying.seekTargetMs(RemoteCommand(RemoteCommandKind.SEEK, 42.0), 5_000)

    assertEquals(42_000L, target)
  }

  @Test
  fun `skip forward adds the interval`() {
    val target = VideoNowPlaying.seekTargetMs(RemoteCommand(RemoteCommandKind.SKIP_FORWARD, 10.0), 5_000)

    assertEquals(15_000L, target)
  }

  @Test
  fun `skip uses ten seconds without a value`() {
    val target = VideoNowPlaying.seekTargetMs(RemoteCommand(RemoteCommandKind.SKIP_FORWARD), 5_000)

    assertEquals(15_000L, target)
  }

  @Test
  fun `skip backward stops at zero`() {
    val target = VideoNowPlaying.seekTargetMs(RemoteCommand(RemoteCommandKind.SKIP_BACKWARD, 10.0), 3_000)

    assertEquals(0L, target)
  }

  @Test
  fun `play has no seek target`() {
    val target = VideoNowPlaying.seekTargetMs(RemoteCommand(RemoteCommandKind.PLAY), 5_000)

    assertNull(target)
  }
}
