package expo.modules.mediasession

import android.media.AudioAttributes
import android.media.AudioManager
import expo.modules.mediasession.RecordingObserver.Event
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SystemEventTest {
  private val scheduler = TestCoroutineScheduler()
  private val backend = FakeSessionBackend()
  private val observer = RecordingObserver()
  private val manager = MediaSessionManager(backend, StandardTestDispatcher(scheduler)).apply {
    coordinator.log = {}
    addObserver(observer)
    setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
  }

  @After
  fun tearDown() {
    manager.coordinator.close()
    runCurrent()
  }

  private fun runCurrent() = scheduler.runCurrent()

  private val began = Event.InterruptionBegan(InterruptionReason.DEFAULT)

  private fun focusChange(change: Int) {
    backend.emitFocusChange(change)
    runCurrent()
  }

  @Test
  fun testDelayedGrantResolvesOnGain() {
    backend.result = FocusResult.DELAYED
    val use = manager.beginUse("a")
    runCurrent()
    assertFalse(use.activation.isCompleted)

    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertTrue(use.activation.isCompleted)
    assertNull(use.activation.getCompletionExceptionOrNull())
    assertTrue(observer.events.isEmpty())
    use.end()
  }

  @Test
  fun transientLossKeepsDelayedWaitersPending() {
    backend.result = FocusResult.DELAYED
    val use = manager.beginUse("a")
    runCurrent()

    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    assertFalse(use.activation.isCompleted)

    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertTrue(use.activation.isCompleted)
    assertNull(use.activation.getCompletionExceptionOrNull())
    use.end()
  }

  @Test
  fun grantDuringSuspendResolvesAfterResume() {
    backend.result = FocusResult.DELAYED
    val use = manager.beginUse("a")
    runCurrent()
    manager.suspendWrites("call")
    runCurrent()

    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertFalse(use.activation.isCompleted)
    focusChange(AudioManager.AUDIOFOCUS_LOSS)
    assertFalse(use.activation.isCompleted)
    assertEquals(0, backend.abandons)

    backend.result = FocusResult.GRANTED
    manager.resumeWrites()
    runCurrent()
    assertTrue(use.activation.isCompleted)
    assertNull(use.activation.getCompletionExceptionOrNull())
    use.end()
  }

  @Test
  fun testInterruptionFansOutToAllObservers() {
    val second = RecordingObserver()
    manager.addObserver(second)
    val use = manager.beginUse("a")
    runCurrent()

    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    val expected = listOf(Event.FocusLost(transient = true), began, Event.InterruptionEnded(true))
    assertEquals(expected, observer.events)
    assertEquals(expected, second.events)
    use.end()
  }

  @Test
  fun testFocusLossTransientVsPermanent() {
    val use = manager.beginUse("a")
    runCurrent()

    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    assertEquals(listOf(Event.FocusLost(transient = true), began), observer.events)
    assertEquals(0, backend.abandons)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    observer.events.clear()

    focusChange(AudioManager.AUDIOFOCUS_LOSS)
    assertEquals(listOf(Event.FocusLost(transient = false), began), observer.events)
    assertEquals(FakeSessionBackend.Call.Abandon, backend.calls.last())

    val second = manager.beginUse("b")
    runCurrent()
    assertEquals(2, backend.requests)
    assertTrue(backend.calls.last() is FakeSessionBackend.Call.Request)
    use.end()
    second.end()
  }

  @Test
  fun canDuckDucksWhenNotPausing() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(listOf(Event.Ducked(true), Event.Ducked(false)), observer.events)
    use.end()
  }

  @Test
  fun canDuckWithPausesWhenDuckedIsTransient() {
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DUCK_OTHERS))
    val use = manager.beginUse("a", SessionRequirements(pausesWhenDucked = true))
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    val transientLoss = listOf(Event.FocusLost(transient = true), began, Event.InterruptionEnded(true))
    assertEquals(transientLoss, observer.events)
    observer.events.clear()

    use.update(SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_SPEECH))
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(transientLoss, observer.events)
    use.end()
  }

  @Test
  fun requestAndAbandonCloseLossState() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    use.update(SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_MOVIE))
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(listOf(Event.FocusLost(transient = true), began, Event.InterruptionEnded(true)), observer.events)
    observer.events.clear()

    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.MIX_WITH_OTHERS))
    runCurrent()
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(listOf(Event.Ducked(true), Event.Ducked(false)), observer.events)
    use.end()
  }

  @Test
  fun updateRequestClosesDuck() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    use.update(SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_MOVIE))
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(listOf(Event.Ducked(true), Event.Ducked(false)), observer.events)
    use.end()
  }

  @Test
  fun delayedRequestKeepsInterruptionOpenUntilGrant() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    backend.result = FocusResult.DELAYED
    use.update(SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_MOVIE))
    runCurrent()
    assertEquals(listOf(Event.FocusLost(transient = true), began), observer.events)

    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(listOf(Event.FocusLost(transient = true), began, Event.InterruptionEnded(true)), observer.events)
    use.end()
  }

  @Test
  fun lossOfDelayedRequestAfterTransientLossIsPermanent() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    backend.result = FocusResult.DELAYED
    use.update(SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_MOVIE))
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS)

    assertEquals(
      listOf(
        Event.FocusLost(transient = true),
        began,
        Event.InterruptionEnded(false),
        Event.FocusLost(transient = false),
        began
      ),
      observer.events
    )
    use.end()
  }

  @Test
  fun resumeRequestEndsInterruptionOnce() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    manager.suspendWrites("call")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    manager.resumeWrites()
    runCurrent()

    assertEquals(
      listOf(
        Event.FocusLost(transient = true),
        began,
        Event.Suspended("call"),
        Event.Resumed,
        Event.InterruptionEnded(true)
      ),
      observer.events
    )
    use.end()
  }

  @Test
  fun abandonWithLiveUseEndsInterruption() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.MIX_WITH_OTHERS))
    runCurrent()

    assertEquals(FakeSessionBackend.Call.Abandon, backend.calls.last())
    assertEquals(listOf(Event.FocusLost(transient = true), began, Event.InterruptionEnded(true)), observer.events)
    use.end()
  }

  @Test
  fun releaseAfterTransientLossEndsInterruptionWithoutResume() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    use.end()
    runCurrent()
    scheduler.advanceTimeBy(1000)
    runCurrent()

    assertEquals(FakeSessionBackend.Call.Abandon, backend.calls.last())
    assertEquals(listOf(Event.FocusLost(transient = true), began, Event.InterruptionEnded(false)), observer.events)
  }

  @Test
  fun lossAfterTransientLossEndsThePair() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    focusChange(AudioManager.AUDIOFOCUS_LOSS)

    assertEquals(
      listOf(
        Event.FocusLost(transient = true),
        began,
        Event.InterruptionEnded(false),
        Event.FocusLost(transient = false),
        began
      ),
      observer.events
    )
    use.end()
  }

  @Test
  fun lossAfterDuckEndsTheDuck() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    focusChange(AudioManager.AUDIOFOCUS_LOSS)

    assertEquals(
      listOf(Event.Ducked(true), Event.Ducked(false), Event.FocusLost(transient = false), began),
      observer.events
    )
    use.end()
  }

  @Test
  fun lossDuringSuspendIsReportedOnResume() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    manager.suspendWrites("call")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    focusChange(AudioManager.AUDIOFOCUS_LOSS)
    assertEquals(listOf(Event.FocusLost(transient = true), began, Event.Suspended("call")), observer.events)
    observer.events.clear()

    backend.result = FocusResult.DELAYED
    manager.resumeWrites()
    runCurrent()
    assertEquals(
      listOf(Event.Resumed, Event.InterruptionEnded(false), Event.FocusLost(transient = false), began),
      observer.events
    )

    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(Event.InterruptionEnded(true), observer.events.last())
    assertEquals(5, observer.events.size)
    use.end()
  }

  @Test
  fun lossDuringSuspendRegainedOnResumeIsNotReported() {
    val use = manager.beginUse("a")
    runCurrent()
    manager.suspendWrites("call")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS)
    manager.resumeWrites()
    runCurrent()

    assertEquals(listOf(Event.Suspended("call"), Event.Resumed), observer.events)
    use.end()
  }

  @Test
  fun failedResumeRequestEndsInterruptionWithoutResume() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    manager.suspendWrites("call")
    runCurrent()
    backend.requestError = IllegalStateException("denied")
    manager.resumeWrites()
    runCurrent()
    assertEquals(FakeSessionBackend.Call.Abandon, backend.calls.last())
    assertEquals(1, backend.abandons)
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(
      listOf(
        Event.FocusLost(transient = true),
        began,
        Event.Suspended("call"),
        Event.Resumed,
        Event.Failed("a"),
        Event.InterruptionEnded(false)
      ),
      observer.events
    )
    use.end()
  }

  @Test
  fun failedResumeRequestEndsDuck() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    manager.suspendWrites("call")
    runCurrent()
    backend.requestError = IllegalStateException("denied")
    manager.resumeWrites()
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_GAIN)

    assertEquals(
      listOf(Event.Ducked(true), Event.Suspended("call"), Event.Resumed, Event.Failed("a"), Event.Ducked(false)),
      observer.events
    )
    use.end()
  }

  @Test
  fun mixWithOthersDuringSuspendAbandonsAndEndsInterruptionWithLiveUse() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    manager.suspendWrites("call")
    runCurrent()
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.MIX_WITH_OTHERS))
    runCurrent()
    manager.resumeWrites()
    runCurrent()

    assertEquals(FakeSessionBackend.Call.Abandon, backend.calls.last())
    assertEquals(
      listOf(
        Event.FocusLost(transient = true),
        began,
        Event.Suspended("call"),
        Event.Resumed,
        Event.InterruptionEnded(true)
      ),
      observer.events
    )
    use.end()
  }

  @Test
  fun repeatedCanDuckDucksOnce() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)

    assertEquals(listOf(Event.Ducked(true)), observer.events)
    use.end()
  }

  @Test
  fun repeatedTransientLossBeginsOnce() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)

    assertEquals(listOf(Event.FocusLost(transient = true), began), observer.events)
    use.end()
  }

  @Test
  fun interruptionEndedWaitsForResume() {
    val use = manager.beginUse("a")
    runCurrent()
    focusChange(AudioManager.AUDIOFOCUS_LOSS_TRANSIENT)
    manager.suspendWrites("call")
    focusChange(AudioManager.AUDIOFOCUS_GAIN)
    assertEquals(
      listOf(Event.FocusLost(transient = true), began, Event.Suspended("call")),
      observer.events
    )

    manager.resumeWrites()
    runCurrent()
    assertEquals(listOf(Event.Resumed, Event.InterruptionEnded(true)), observer.events.takeLast(2))
    use.end()
  }

  @Test
  fun testBecomingNoisyMapsToOldDeviceUnavailable() {
    manager.coordinator.onBecomingNoisy()
    runCurrent()

    assertEquals(listOf(Event.RouteChanged(RouteChangeReason.OLD_DEVICE_UNAVAILABLE)), observer.events)
  }

  @Test
  fun silentModeIsReportedOnlyWhenItChanges() {
    val coordinator = manager.coordinator
    coordinator.onRingerModeChanged(AudioManager.RINGER_MODE_NORMAL)
    coordinator.onRingerModeChanged(AudioManager.RINGER_MODE_NORMAL)
    coordinator.onRingerModeChanged(AudioManager.RINGER_MODE_VIBRATE)
    coordinator.onRingerModeChanged(AudioManager.RINGER_MODE_SILENT)
    coordinator.onRingerModeChanged(AudioManager.RINGER_MODE_NORMAL)
    runCurrent()

    assertEquals(listOf(Event.SilentModeChanged(true), Event.SilentModeChanged(false)), observer.events)
  }
}
