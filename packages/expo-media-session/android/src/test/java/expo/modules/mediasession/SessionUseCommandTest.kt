package expo.modules.mediasession

import android.media.AudioManager
import java.util.concurrent.Executor
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SessionUseCommandTest {
  private val scheduler = TestCoroutineScheduler()
  private val backend = FakeSessionBackend()
  private val observer = RecordingObserver()
  private val delegate = RecordingUseDelegate()
  private val queued = mutableListOf<Runnable>()
  private val queue = Executor { queued.add(it) }
  private val manager = MediaSessionManager(backend, StandardTestDispatcher(scheduler)).apply {
    coordinator.log = {}
    addObserver(observer)
    setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
  }

  @After
  fun tearDown() {
    manager.coordinator.close()
    scheduler.runCurrent()
  }

  private fun begin(
    name: String,
    requirements: SessionRequirements = SessionRequirements(),
    executor: Executor = Executor { it.run() }
  ): SessionUse {
    val use = manager.beginUse(name, requirements, delegate, executor)
    delegate.name(use, name)
    scheduler.runCurrent()
    return use
  }

  private fun focusChange(change: Int) {
    backend.emitFocusChange(change)
    scheduler.runCurrent()
  }

  @Test
  fun transientLossPausesAndGainResumes() {
    val a = begin("a")
    val b = begin("b")
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(
      listOf("pause a interruption", "pause b interruption", "resume a", "resume b"),
      delegate.commands
    )
    a.end()
    b.end()
  }

  @Test
  fun permanentLossPausesAndEndsEveryUse() {
    val a = begin("a")
    val b = begin("b")
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    focusChange(AudioManager.AUDIOFOCUS_LOSS)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(
      listOf(
        "pause a interruption",
        "pause b interruption",
        "pause a focusLost",
        "pause b focusLost",
        "ended a",
        "ended b"
      ),
      delegate.commands
    )
    assertEquals(0, manager.coordinator.useCount)
    a.end()
    b.end()
  }

  @Test
  fun duckableLossDucksAndRestores() {
    val a = begin("a")
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(listOf("duck a true", "duck a false"), delegate.commands)
    a.end()
  }

  @Test
  fun duckableLossPausesWhenDucked() {
    val a = begin("a", SessionRequirements(pausesWhenDucked = true))
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)

    assertEquals(listOf("pause a interruption"), delegate.commands)
    a.end()
  }

  @Test
  fun becomingNoisyPausesAndEndsPlaybackUsesOnly() {
    val player = begin("player")
    val recorder = begin("recorder", SessionRequirements(capabilities = setOf(SessionCapability.RECORD)))
    manager.coordinator.onBecomingNoisy()
    scheduler.runCurrent()

    assertEquals(listOf("pause player outputDisconnected", "ended player"), delegate.commands)
    assertEquals(1, manager.coordinator.useCount)
    player.end()
    recorder.end()
  }

  @Test
  fun delayedGrantPausesThenResumesTheNewUse() {
    backend.result = FocusResult.DELAYED
    val a = begin("a")
    assertEquals(listOf("pause a interruption"), delegate.commands)

    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(listOf("pause a interruption", "resume a"), delegate.commands)
    a.end()
  }

  @Test
  fun grantedUseDuringTransientLossResumesOlderUses() {
    val a = begin("a")
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    val b = begin("b")

    assertEquals(listOf("pause a interruption", "resume a"), delegate.commands)
    a.end()
    b.end()
  }

  @Test
  fun failedRequestFailsAndEndsTheUse() {
    backend.requestError = IllegalStateException("refused")
    val a = begin("a")

    assertEquals(listOf("failed a", "ended a"), delegate.commands)
    assertTrue(observer.events.contains(RecordingObserver.Event.Failed("a")))
    assertEquals(0, manager.coordinator.useCount)
    a.end()
  }

  @Test
  fun usesWithoutDelegateAndHoldsGetNoCommands() {
    val use = manager.beginUse("plain")
    val hold = manager.hold("hold")
    scheduler.runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS)
    manager.coordinator.onBecomingNoisy()
    scheduler.runCurrent()

    assertEquals(emptyList<String>(), delegate.commands)
    assertEquals(2, manager.coordinator.useCount)
    use.end()
    hold.release()
  }

  @Test
  fun backgroundPausesOnlyOptedOutUses() {
    val foreground = begin("foreground")
    val background = begin("background", SessionRequirements(continuesInBackground = true))
    manager.coordinator.onBackground()
    manager.coordinator.onForeground()
    scheduler.runCurrent()

    assertEquals(listOf("pause foreground background", "resume foreground"), delegate.commands)
    assertEquals(1, backend.requests)
    foreground.end()
    background.end()
  }

  @Test
  fun foregroundWithDelayedGrantWaitsForTheGrant() {
    val a = begin("a")
    manager.coordinator.onBackground()
    scheduler.runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    backend.result = FocusResult.DELAYED
    manager.coordinator.onForeground()
    scheduler.runCurrent()
    assertEquals(listOf("pause a background"), delegate.commands)

    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(listOf("pause a background", "resume a"), delegate.commands)
    a.end()
  }

  @Test
  fun useBegunInBackgroundIsNotPaused() {
    manager.coordinator.onBackground()
    val a = begin("a")
    manager.coordinator.onForeground()
    scheduler.runCurrent()

    assertEquals(emptyList<String>(), delegate.commands)
    a.end()
  }

  @Test
  fun useBegunWhileDuckedDucksAndRestoresWithTheOthers() {
    val a = begin("a")
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    val b = begin("b")
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(listOf("duck a true", "duck b true", "duck a false", "duck b false"), delegate.commands)
    a.end()
    b.end()
  }

  @Test
  fun clientEndDoesNotSendDidEnd() {
    val a = begin("a")
    a.end()
    scheduler.runCurrent()

    assertEquals(emptyList<String>(), delegate.commands)
  }

  @Test
  fun commandsRunOnTheGivenExecutor() {
    val a = begin("a", executor = queue)
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    assertEquals(emptyList<String>(), delegate.commands)

    queued.forEach { it.run() }
    assertEquals(listOf("pause a interruption"), delegate.commands)
    a.end()
  }

  @Test
  fun commandAfterClientEndIsDropped() {
    val a = begin("a", executor = queue)
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    a.end()
    queued.forEach { it.run() }

    assertEquals(emptyList<String>(), delegate.commands)
  }

  @Test
  fun moduleEndStillDeliversTheFinalCommands() {
    val a = begin("a", executor = queue)
    focusChange(AudioManager.AUDIOFOCUS_LOSS)
    queued.forEach { it.run() }

    assertEquals(listOf("pause a focusLost", "ended a"), delegate.commands)
    assertEquals(0, manager.coordinator.useCount)
    a.end()
  }

  @Test
  fun backgroundPausedUseKeepsFocus() {
    val a = begin("a")
    manager.coordinator.onBackground()
    scheduler.advanceTimeBy(2000)
    scheduler.runCurrent()

    assertEquals(0, backend.abandons)
    a.end()
  }
}
