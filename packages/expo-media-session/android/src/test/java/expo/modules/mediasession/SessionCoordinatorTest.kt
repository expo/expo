package expo.modules.mediasession

import android.media.AudioAttributes
import android.media.AudioManager
import java.util.concurrent.CountDownLatch
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SessionCoordinatorTest {
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

  private fun advance(milliseconds: Long) {
    scheduler.advanceTimeBy(milliseconds)
    scheduler.runCurrent()
  }

  private fun focus(requirements: SessionRequirements = SessionRequirements()) =
    SessionResolver.resolve(manager.policy, listOf(requirements)).focus!!

  @Test
  fun firstUseRequestsFocus() = runTest(scheduler) {
    val use = manager.beginUse("a")
    use.awaitActivation()

    assertEquals(listOf(FakeSessionBackend.Call.Request(focus())), backend.calls)
    assertEquals(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT, focus().gain)
    use.end()
  }

  @Test
  fun releaseAfterOneSecondHold() {
    manager.beginUse("a").end()
    runCurrent()

    advance(999)
    assertEquals(0, backend.abandons)
    advance(1)
    assertEquals(FakeSessionBackend.Call.Abandon, backend.calls.last())
    assertEquals(1, backend.abandons)
  }

  @Test
  fun newUseCancelsPendingRelease() {
    manager.beginUse("a").end()
    runCurrent()
    advance(500)
    val second = manager.beginUse("b")
    advance(2000)

    assertEquals(0, backend.abandons)
    assertEquals(1, backend.requests)
    second.end()
  }

  @Test
  fun beginDuringReleaseRequestsFocusAgain() {
    manager.beginUse("a").end()
    runCurrent()
    var second: SessionUse? = null
    backend.duringAbandon = { second = manager.beginUse("b") }
    advance(1000)

    assertEquals(
      listOf(FakeSessionBackend.Call.Abandon, FakeSessionBackend.Call.Request(focus())),
      backend.calls.takeLast(2)
    )
    assertEquals(1, manager.coordinator.useCount)
    second?.end()
  }

  @Test
  fun beginAfterReleaseIsDueCancelsIt() {
    manager.beginUse("a").end()
    runCurrent()
    scheduler.advanceTimeBy(1000)
    val second = manager.beginUse("b")
    runCurrent()

    assertEquals(0, backend.abandons)
    assertEquals(1, backend.requests)
    second.end()
  }

  @Test
  fun focusReturnsAfterMixWithOthersStep() {
    val use = manager.beginUse("a")
    runCurrent()
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.MIX_WITH_OTHERS))
    runCurrent()
    assertEquals(FakeSessionBackend.Call.Abandon, backend.calls.last())

    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX))
    runCurrent()
    assertEquals(FakeSessionBackend.Call.Request(focus()), backend.calls.last())
    assertEquals(2, backend.requests)
    use.end()
  }

  @Test
  fun delayedFocusWaitsForGrant() {
    backend.result = FocusResult.DELAYED
    val use = manager.beginUse("a")
    runCurrent()
    assertFalse(use.activation.isCompleted)

    backend.emitFocusChange(AudioManager.AUDIOFOCUS_GAIN)
    runCurrent()
    assertTrue(use.activation.isCompleted)
    assertFalse(use.activation.isCancelled)
    use.end()
  }

  @Test
  fun delayedFocusFailsWhenLost() {
    backend.result = FocusResult.DELAYED
    val use = manager.beginUse("a")
    runCurrent()
    backend.emitFocusChange(AudioManager.AUDIOFOCUS_LOSS)
    runCurrent()

    assertTrue(use.activation.getCompletionExceptionOrNull() is MediaSessionException)
    use.end()
  }

  @Test
  fun updateDuringDelayedWaitAppliesAfterGrant() {
    backend.result = FocusResult.DELAYED
    val use = manager.beginUse("a")
    runCurrent()
    val movie = SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_MOVIE)
    use.update(movie)
    runCurrent()

    backend.result = FocusResult.GRANTED
    backend.emitFocusChange(AudioManager.AUDIOFOCUS_GAIN)
    runCurrent()
    assertEquals(FakeSessionBackend.Call.Request(focus(movie)), backend.calls.last())
    use.end()
  }

  @Test
  fun failedRequestClearsDelayedState() {
    backend.result = FocusResult.DELAYED
    val use = manager.beginUse("a")
    runCurrent()
    manager.suspendWrites("call")
    backend.requestError = IllegalStateException("AUDIOFOCUS_REQUEST_FAILED")
    manager.resumeWrites()
    runCurrent()

    assertFalse(manager.coordinator.isFocusDelayed)
    use.end()
  }

  @Test
  fun pruneFailsPendingActivationAndReconcilesTheRest() {
    val kept = manager.beginUse("kept")
    runCurrent()
    manager.suspendWrites("call")
    val leaked = manager.beginUse("leaked", SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_MOVIE))
    runCurrent()
    manager.coordinator.clearTokenReference(leaked.id)
    manager.resumeWrites()
    runCurrent()

    assertTrue(leaked.activation.getCompletionExceptionOrNull() is MediaSessionException)
    assertEquals(1, manager.coordinator.useCount)
    assertEquals(FakeSessionBackend.Call.Request(focus()), backend.calls.last())
    kept.end()
  }

  @Test
  fun collectedTokenIsPruned() {
    val use = manager.beginUse("a")
    runCurrent()
    manager.coordinator.clearTokenReference(use.id)
    manager.setPolicy(AudioPolicyUpdate())
    runCurrent()
    assertEquals(0, manager.coordinator.useCount)

    advance(1000)
    assertEquals(1, backend.abandons)
  }

  @Test
  fun activationWaitsForResume() {
    manager.suspendWrites("call")
    val use = manager.beginUse("a")
    runCurrent()
    assertFalse(use.activation.isCompleted)

    manager.resumeWrites()
    runCurrent()
    assertTrue(use.activation.isCompleted)
    assertEquals(listOf(FakeSessionBackend.Call.Request(focus())), backend.calls)
    use.end()
  }

  @Test
  fun holdTokensAreIndependent() {
    val first = manager.hold("a")
    val second = manager.hold("b")
    first.release()
    first.close()
    advance(2000)
    assertEquals(0, backend.abandons)

    second.close()
    runCurrent()
    advance(999)
    assertEquals(0, backend.abandons)
    advance(1)
    assertEquals(1, backend.abandons)
  }

  @Test
  fun setPolicyWithoutUseWritesNothing() {
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DO_NOT_MIX_PERSISTENT))
    advance(2000)
    assertTrue(backend.calls.isEmpty())
    assertEquals(InterruptionMode.DO_NOT_MIX_PERSISTENT, manager.policy.interruptionMode)

    val use = manager.beginUse("a")
    runCurrent()
    assertEquals(listOf(FakeSessionBackend.Call.Request(focus())), backend.calls)
    assertEquals(AudioManager.AUDIOFOCUS_GAIN, focus().gain)
    use.end()
  }

  @Test
  fun suspendFreezesWrites() {
    val requirements = SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_SPEECH)
    manager.suspendWrites("call")
    manager.beginUse("a").end()
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = InterruptionMode.DUCK_OTHERS))
    val use = manager.beginUse("b", requirements)
    advance(2000)

    assertTrue(backend.calls.isEmpty())
    assertEquals(listOf(RecordingObserver.Event.Suspended("call")), observer.events)
    assertEquals(1, manager.coordinator.useCount)

    manager.resumeWrites()
    runCurrent()
    assertEquals(listOf(FakeSessionBackend.Call.Request(focus(requirements))), backend.calls)
    assertEquals(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK, focus(requirements).gain)
    assertEquals(listOf(RecordingObserver.Event.Suspended("call"), RecordingObserver.Event.Resumed), observer.events)
    use.end()
  }

  @Test
  fun concurrentBeginEndConverges() {
    val start = CountDownLatch(1)
    val threads = (0 until 8).map { thread ->
      Thread {
        start.await()
        val open = mutableListOf<SessionUse>()
        repeat(1000) { index ->
          val use = manager.beginUse("thread-$thread")
          if (index % 2 == 0) {
            use.end()
          } else {
            open.add(use)
          }
        }
        open.forEach { it.close() }
      }.apply { start() }
    }
    start.countDown()
    threads.forEach { it.join() }
    runCurrent()

    assertEquals(0, manager.coordinator.useCount)
    assertEquals(1, backend.requests)
    assertEquals(0, backend.abandons)
    advance(1000)
    assertEquals(1, backend.abandons)
  }

  @Test
  fun activationFailureReportsAndDoesNotLeakUse() = runTest(scheduler) {
    val platformError = IllegalStateException("AUDIOFOCUS_REQUEST_FAILED")
    backend.requestError = platformError
    val use = manager.beginUse("a")

    val error = try {
      use.awaitActivation()
      null
    } catch (e: MediaSessionException) {
      e
    }
    assertSame(platformError, error!!.cause)
    assertEquals(listOf(RecordingObserver.Event.Failed("a")), observer.events)

    use.end()
    advance(5000)
    assertEquals(0, manager.coordinator.useCount)
    assertEquals(listOf(FakeSessionBackend.Call.Request(focus())), backend.calls)
  }

  @Test
  fun updateRequirementsReconfigures() {
    val use = manager.beginUse("a")
    runCurrent()
    val movie = SessionRequirements(contentType = AudioAttributes.CONTENT_TYPE_MOVIE)
    use.update(movie)
    runCurrent()

    assertEquals(FakeSessionBackend.Call.Request(focus(movie)), backend.calls.last())
    assertEquals(AudioAttributes.CONTENT_TYPE_MOVIE, focus(movie).contentType)
    assertEquals(2, backend.requests)
    use.end()
  }

  @Test
  fun awaitActivationResolvesAfterActivationAndThrowsOnFailure() = runTest(scheduler) {
    val use = manager.beginUse("a")
    use.awaitActivation()
    use.awaitActivation()
    assertEquals(listOf(FakeSessionBackend.Call.Request(focus())), backend.calls)
    use.end()
    try {
      use.awaitActivation()
      fail("Expected SessionUseEndedException")
    } catch (_: SessionUseEndedException) {
    }
    advance(1000)

    backend.requestError = IllegalStateException("AUDIOFOCUS_REQUEST_FAILED")
    val hold = manager.hold("b")
    try {
      hold.awaitActivation()
      fail("Expected MediaSessionException")
    } catch (_: MediaSessionException) {
    }
    hold.release()
    runCurrent()
    assertEquals(0, manager.coordinator.useCount)
  }

  @Test
  fun closeFailsPendingActivations() = runTest(scheduler) {
    manager.suspendWrites("call")
    val suspended = manager.beginUse("a")
    manager.coordinator.close()
    val late = manager.beginUse("b")
    for (use in listOf(suspended, late)) {
      try {
        use.awaitActivation()
        fail("Expected MediaSessionException")
      } catch (_: MediaSessionException) {
      }
    }
  }

  @Test
  fun removingRegistrationStopsDeliveryFromAnyThread() {
    val second = RecordingObserver()
    val registration = manager.addObserver(second)
    runCurrent()
    val threads = (0 until 8).map { index ->
      Thread {
        if (index % 2 == 0) {
          registration.remove()
        } else {
          registration.close()
        }
      }.apply { start() }
    }
    threads.forEach { it.join() }
    manager.suspendWrites("call")
    runCurrent()

    assertTrue(second.events.isEmpty())
    assertEquals(listOf(RecordingObserver.Event.Suspended("call")), observer.events)
  }

  @Test
  fun endedUseLeavesNoPendingActivation() {
    manager.suspendWrites("call")
    val use = manager.beginUse("a")
    runCurrent()
    assertEquals(1, manager.coordinator.pendingActivationCount)

    use.end()
    runCurrent()
    assertEquals(0, manager.coordinator.pendingActivationCount)
    assertEquals(0, manager.coordinator.useCount)
  }

  @Test
  fun closeAbandonsHeldFocusAndCancelsRelease() {
    manager.beginUse("a").end()
    runCurrent()
    manager.coordinator.close()
    runCurrent()

    assertEquals(1, backend.abandons)
    assertNull(manager.coordinator.heldFocus)
    advance(2000)
    assertEquals(1, backend.abandons)
  }

  @Test
  fun failedBeginTaskReportsTheFailure() {
    val failure = AssertionError("boom")
    backend.requestError = failure
    val use = manager.beginUse("a")
    runCurrent()

    val error = use.activation.getCompletionExceptionOrNull()
    assertTrue(error is MediaSessionException)
    assertTrue(error!!.message!!.contains("coordinator task failed"))
    assertSame(failure, error.cause)
  }
}
