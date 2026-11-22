package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException
import java.util.concurrent.Executor
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

private class Player(private val session: MediaSessionManaging) : SessionUseDelegate {
  var use: SessionUse? = null
  var isPlaying = false

  fun play() {
    use = session.beginUse("player", delegate = this, executor = Executor { it.run() })
    isPlaying = true
  }

  override fun sessionUsePause(use: SessionUse, reason: SessionPauseReason) {
    if (use === this.use) {
      isPlaying = false
    }
  }

  override fun sessionUseResume(use: SessionUse) {
    if (use === this.use) {
      isPlaying = true
    }
  }

  override fun sessionUseDuck(use: SessionUse, isDucked: Boolean) {}

  override fun sessionUseDidFail(use: SessionUse, error: CodedException) {}

  override fun sessionUseDidEnd(use: SessionUse) {
    if (use === this.use) {
      this.use = null
    }
  }
}

class ManagingInterfaceTest {
  @Test
  fun clientRunsAgainstTheFake() {
    val manager = FakeMediaSessionManager()
    val player = Player(manager)
    player.play()
    val first = manager.uses.first()
    player.play()

    first.pause(SessionPauseReason.INTERRUPTION)
    assertTrue(player.isPlaying)
    val current = manager.uses.last()
    assertSame(player, current.delegate)
    current.pause(SessionPauseReason.INTERRUPTION)
    assertFalse(player.isPlaying)
    current.resume()
    assertTrue(player.isPlaying)
  }

  @Test
  fun fakeEndsAUseWithACommandThenDidEnd() {
    val manager = FakeMediaSessionManager()
    val delegate = RecordingUseDelegate()
    val use = manager.beginUse("player", delegate = delegate, executor = Executor { it.run() })
    delegate.name(use, "player")

    manager.uses.single().endByModule(SessionPauseReason.FOCUS_LOST)

    assertEquals(listOf("pause player focusLost", "ended player"), delegate.commands)
    assertTrue(manager.uses.single().isEndedByModule)
  }

  @Test
  fun fakeDropsCommandsAfterClientEnd() {
    val manager = FakeMediaSessionManager()
    val player = Player(manager)
    player.play()
    val use = manager.uses.single()
    use.end()

    use.pause(SessionPauseReason.INTERRUPTION)

    assertTrue(player.isPlaying)
    assertTrue(use.isEndedByClient)
  }

  @Test
  fun fakeFailsTheNextActivation() {
    val manager = FakeMediaSessionManager()
    val error = MediaSessionException("refused")
    manager.failNextActivation(error)
    val use = manager.beginUse("player") as FakeMediaSessionManager.Use

    val thrown = runBlocking { runCatching { use.awaitActivation() }.exceptionOrNull() }

    assertSame(error, thrown)
    assertTrue(use.isEndedByModule)
    runBlocking { manager.beginUse("player").awaitActivation() }
  }
}
