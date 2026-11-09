package expo.modules.mediasession.service

import androidx.media3.common.Player
import expo.modules.mediasession.NowPlayingInfo
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TransportCommandsTest {
  private val playback = setOf(RemoteCommandKind.PLAY, RemoteCommandKind.PAUSE)

  @Test
  fun playWhenReadyPrefersPlayAndPauseOverToggle() {
    val toggle = setOf(RemoteCommandKind.TOGGLE_PLAY_PAUSE)

    assertEquals(RemoteCommand(RemoteCommandKind.PLAY), playWhenReadyCommand(true, playback + toggle, isPlaying = true))
    assertEquals(RemoteCommand(RemoteCommandKind.PAUSE), playWhenReadyCommand(false, playback, isPlaying = false))
    assertEquals(RemoteCommand(RemoteCommandKind.TOGGLE_PLAY_PAUSE), playWhenReadyCommand(false, toggle, isPlaying = true))
    assertEquals(RemoteCommand(RemoteCommandKind.TOGGLE_PLAY_PAUSE), playWhenReadyCommand(true, toggle, isPlaying = false))
    assertNull(playWhenReadyCommand(true, toggle, isPlaying = true))
    assertNull(playWhenReadyCommand(false, toggle, isPlaying = false))
    assertNull(playWhenReadyCommand(true, setOf(RemoteCommandKind.SEEK), isPlaying = false))
  }

  @Test
  fun seeksMapToTheirKinds() {
    val info = NowPlayingInfo(skipForwardInterval = 30.0, skipBackwardInterval = 0.01)

    assertEquals(RemoteCommand(RemoteCommandKind.SEEK, 61.0), seekCommand(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM, 61_000, info))
    assertEquals(RemoteCommand(RemoteCommandKind.SKIP_FORWARD, 30.0), seekCommand(Player.COMMAND_SEEK_FORWARD, 0, info))
    assertEquals(RemoteCommand(RemoteCommandKind.SKIP_BACKWARD, 0.1), seekCommand(Player.COMMAND_SEEK_BACK, 0, info))
    assertEquals(RemoteCommand(RemoteCommandKind.NEXT_TRACK), seekCommand(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM, 0, info))
    assertEquals(RemoteCommand(RemoteCommandKind.NEXT_TRACK), seekCommand(Player.COMMAND_SEEK_TO_NEXT, 0, info))
    assertEquals(RemoteCommand(RemoteCommandKind.PREVIOUS_TRACK), seekCommand(Player.COMMAND_SEEK_TO_PREVIOUS, 0, info))
    assertEquals(
      RemoteCommand(RemoteCommandKind.PREVIOUS_TRACK),
      seekCommand(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM, 0, info)
    )
    assertEquals(RemoteCommand(RemoteCommandKind.SKIP_FORWARD, 10.0), seekCommand(Player.COMMAND_SEEK_FORWARD, 0, NowPlayingInfo()))
  }

  @Test
  fun playerCommandsFollowKinds() {
    val commands = playerCommandSet(setOf(RemoteCommandKind.SEEK, RemoteCommandKind.NEXT_TRACK, RemoteCommandKind.SKIP_BACKWARD))

    assertTrue(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM in commands)
    assertTrue(Player.COMMAND_SEEK_TO_NEXT in commands)
    assertTrue(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM in commands)
    assertTrue(Player.COMMAND_SEEK_BACK in commands)
    assertFalse(Player.COMMAND_PLAY_PAUSE in commands)
    assertFalse(Player.COMMAND_SEEK_TO_PREVIOUS in commands)
    assertTrue(Player.COMMAND_GET_CURRENT_MEDIA_ITEM in commands)
  }

  @Test
  fun layoutShowsTracksBeforeSkips() {
    assertEquals(
      listOf(TransportButton.PREVIOUS_TRACK, TransportButton.PLAY_PAUSE, TransportButton.NEXT_TRACK),
      transportLayout(
        playback + RemoteCommandKind.NEXT_TRACK + RemoteCommandKind.PREVIOUS_TRACK + RemoteCommandKind.SKIP_FORWARD +
          RemoteCommandKind.SKIP_BACKWARD
      )
    )
    assertEquals(
      listOf(TransportButton.SKIP_BACKWARD, TransportButton.PLAY_PAUSE, TransportButton.SKIP_FORWARD),
      transportLayout(playback + RemoteCommandKind.SKIP_FORWARD + RemoteCommandKind.SKIP_BACKWARD)
    )
    assertEquals(listOf(TransportButton.NEXT_TRACK), transportLayout(setOf(RemoteCommandKind.NEXT_TRACK)))
  }

  @Test
  fun playlistGivesNextAndPreviousSomewhereToGo() {
    assertEquals(1 to 0, shape(playback))
    assertEquals(3 to 1, shape(setOf(RemoteCommandKind.NEXT_TRACK, RemoteCommandKind.PREVIOUS_TRACK)))
    assertEquals(2 to 0, shape(setOf(RemoteCommandKind.NEXT_TRACK)))
    assertEquals(2 to 1, shape(setOf(RemoteCommandKind.PREVIOUS_TRACK)))
  }

  private fun shape(kinds: Set<RemoteCommandKind>) = playlistShape(kinds).let { it.count to it.currentIndex }
}
