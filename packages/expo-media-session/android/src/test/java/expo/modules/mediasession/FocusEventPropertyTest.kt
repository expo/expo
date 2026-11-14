package expo.modules.mediasession

import android.media.AudioAttributes
import android.media.AudioManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.mediasession.RecordingObserver.Event
import kotlin.random.Random
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import org.junit.Assert.fail
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class FocusEventPropertyTest {
  @Test
  fun focusEventsKeepTheirInvariants() {
    assertAllSeeds { run ->
      run.play { run.checkInvariants() }
      run.drain()
    }
  }

  @Test
  fun focusEventsMatchTheLossStateModel() {
    assertAllSeeds { run ->
      val model = LossModel()
      run.play(model::step)
      val actual = run.observer.events.filter(::isFocusEvent)
      if (actual != model.events) {
        throw AssertionError("model ${model.events}\n  coordinator $actual")
      }
    }
  }

  private fun assertAllSeeds(body: (Run) -> Unit) {
    val failures = (0 until SEEDS).mapNotNull { seed ->
      val run = Run(seed)
      try {
        body(run)
        null
      } catch (error: AssertionError) {
        "seed $seed: ${error.message?.substringBefore(": [")}" to
          "seed $seed: ${error.message}\n  steps: ${run.steps.joinToString(", ")}"
      } finally {
        run.close()
      }
    }
    if (failures.isNotEmpty()) {
      fail(
        "${failures.size} of $SEEDS seeds failed:\n${failures.joinToString("\n") { it.first }}\n" +
          failures.take(3).joinToString("\n") { it.second }
      )
    }
  }

  companion object {
    const val SEEDS = 200
    const val STEPS = 30
  }
}

private fun isFocusEvent(event: Event) =
  event is Event.Ducked || event is Event.FocusLost || event is Event.InterruptionBegan || event is Event.InterruptionEnded

private class TimedObserver(private val coordinator: SessionCoordinator) : MediaSessionObserver {
  val events = mutableListOf<Event>()
  val useCounts = mutableListOf<Int>()

  private fun add(event: Event) {
    events.add(event)
    useCounts.add(coordinator.useCount)
  }

  override fun mediaSessionDidFail(error: CodedException, client: String) = add(Event.Failed(client))
  override fun mediaSessionDidSuspendWrites(reason: String) = add(Event.Suspended(reason))
  override fun mediaSessionDidResumeWrites() = add(Event.Resumed)
  override fun mediaSessionInterruptionBegan(reason: InterruptionReason) = add(Event.InterruptionBegan(reason))
  override fun mediaSessionInterruptionEnded(shouldResume: Boolean) = add(Event.InterruptionEnded(shouldResume))
  override fun mediaSessionDucked(isDucked: Boolean) = add(Event.Ducked(isDucked))
  override fun mediaSessionFocusLost(transient: Boolean) = add(Event.FocusLost(transient))
}

private class StepFacts(
  val callback: Int?,
  val calls: List<FakeSessionBackend.Call>,
  val result: FocusResult,
  val throws: Boolean,
  val uses: Int,
  val wantsFocus: Boolean,
  val suspended: Boolean,
  val resumed: Boolean
)

@OptIn(ExperimentalCoroutinesApi::class)
private class Run(seed: Int) {
  private val random = Random(seed)
  private val scheduler = TestCoroutineScheduler()
  private val backend = FakeSessionBackend()
  private val manager = MediaSessionManager(backend, StandardTestDispatcher(scheduler))
  val observer = TimedObserver(manager.coordinator)
  val steps = mutableListOf<String>()
  private val uses = mutableListOf<Pair<SessionUse, SessionRequirements>>()
  private var mode = InterruptionMode.DO_NOT_MIX
  private var suspendDepth = 0
  private var idleSince = 0L
  private var openInterruption: Boolean? = null
  private var grantedSincePermanent = false
  private var checkedEvents = 0

  init {
    manager.coordinator.log = {}
    manager.addObserver(observer)
    manager.setPolicy(AudioPolicyUpdate(interruptionMode = mode))
    scheduler.runCurrent()
  }

  fun close() = manager.coordinator.close()

  fun play(afterStep: (StepFacts) -> Unit) {
    repeat(FocusEventPropertyTest.STEPS) {
      val callsBefore = backend.calls.size
      val result = if (random.nextInt(3) == 0) {
        FocusResult.DELAYED
      } else {
        FocusResult.GRANTED
      }
      val throws = random.nextInt(10) == 0
      backend.result = result
      backend.requestError = if (throws) {
        IllegalStateException("denied")
      } else {
        null
      }
      val wasSuspended = suspendDepth > 0
      val callback = step(
        if (throws) {
          "!"
        } else if (result == FocusResult.DELAYED) {
          "~"
        } else {
          ""
        }
      )
      scheduler.runCurrent()
      val idle = uses.isEmpty() && suspendDepth == 0
      if (!idle) {
        idleSince = Long.MAX_VALUE
      } else if (idleSince == Long.MAX_VALUE) {
        idleSince = scheduler.currentTime
      }
      val calls = backend.calls.subList(callsBefore, backend.calls.size).toList()
      val granted = callback == AudioManager.AUDIOFOCUS_GAIN ||
        (!throws && result == FocusResult.GRANTED && calls.any { it is FakeSessionBackend.Call.Request })
      grantedSincePermanent = grantedSincePermanent || granted
      afterStep(
        StepFacts(
          callback = callback,
          calls = calls,
          result = result,
          throws = throws,
          uses = uses.size,
          wantsFocus = SessionResolver.resolve(manager.policy, uses.map { it.second }).focus != null,
          suspended = suspendDepth > 0,
          resumed = wasSuspended && suspendDepth == 0
        )
      )
    }
  }

  private fun step(outcome: String): Int? {
    when (random.nextInt(100)) {
      in 0 until 15 -> {
        val requirements = randomRequirements()
        steps.add("begin(${label(requirements)})$outcome")
        uses.add(manager.beginUse("u${steps.size}", requirements) to requirements)
      }
      in 15 until 27 -> {
        if (uses.isEmpty()) {
          steps.add("end(none)")
        } else {
          val index = random.nextInt(uses.size)
          steps.add("end(#$index)$outcome")
          uses.removeAt(index).first.end()
        }
      }
      in 27 until 37 -> {
        if (uses.isEmpty()) {
          steps.add("update(none)")
        } else {
          val index = random.nextInt(uses.size)
          val requirements = randomRequirements()
          steps.add("update(#$index, ${label(requirements)})$outcome")
          uses[index] = uses[index].first to requirements
          uses[index].first.update(requirements)
        }
      }
      in 37 until 45 -> {
        mode = listOf(InterruptionMode.MIX_WITH_OTHERS, InterruptionMode.DO_NOT_MIX, InterruptionMode.DUCK_OTHERS)
          .random(random)
        steps.add("setPolicy($mode)$outcome")
        manager.setPolicy(AudioPolicyUpdate(interruptionMode = mode))
      }
      in 45 until 51 -> {
        steps.add("suspend")
        suspendDepth += 1
        manager.suspendWrites("s")
      }
      in 51 until 59 -> {
        steps.add("resume$outcome")
        suspendDepth = maxOf(0, suspendDepth - 1)
        manager.resumeWrites()
      }
      in 59 until 90 -> {
        val change = listOf(
          AudioManager.AUDIOFOCUS_GAIN,
          AudioManager.AUDIOFOCUS_LOSS,
          AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
          AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
          AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK,
          AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK
        ).random(random)
        val name = mapOf(1 to "GAIN", -1 to "LOSS", -2 to "LOSS_TRANSIENT", -3 to "CAN_DUCK").getValue(change)
        if (!backend.holdsFocus) {
          steps.add("$name(not held)")
          return null
        }
        steps.add("$name$outcome")
        backend.emitFocusChange(change)
        return change
      }
      else -> {
        steps.add("advance(1s)")
        scheduler.advanceTimeBy(1000)
      }
    }
    return null
  }

  private fun randomRequirements() = SessionRequirements(
    mixing = listOf(null, null, MixingRequirement.MIX_WITH_OTHERS, MixingRequirement.DUCK_OTHERS, MixingRequirement.DO_NOT_MIX)
      .random(random),
    contentType = listOf(null, AudioAttributes.CONTENT_TYPE_MOVIE, AudioAttributes.CONTENT_TYPE_SPEECH).random(random),
    pausesWhenDucked = random.nextInt(4) == 0
  )

  private fun label(requirements: SessionRequirements) =
    listOfNotNull(
      requirements.mixing?.value,
      requirements.contentType?.let {
        if (it == AudioAttributes.CONTENT_TYPE_SPEECH) {
          "speech"
        } else {
          "movie"
        }
      },
      "pausesWhenDucked".takeIf { requirements.pausesWhenDucked }
    ).joinToString(" ")

  fun drain() {
    backend.result = FocusResult.GRANTED
    backend.requestError = null
    steps.add("drain")
    repeat(suspendDepth) {
      manager.resumeWrites()
      scheduler.runCurrent()
    }
    suspendDepth = 0
    checkInvariants()
    val duckOpen = observer.events.filterIsInstance<Event.Ducked>().lastOrNull()?.isDucked == true
    if (backend.holdsFocus && (duckOpen || openInterruption == true)) {
      backend.emitFocusChange(AudioManager.AUDIOFOCUS_GAIN)
      scheduler.runCurrent()
    }
    uses.forEach { it.first.end() }
    uses.clear()
    scheduler.runCurrent()
    scheduler.advanceTimeBy(SessionCoordinator.RELEASE_DELAY_MS)
    scheduler.runCurrent()
    checkInvariants()
    val ducks = observer.events.filterIsInstance<Event.Ducked>()
    check(ducks.count { it.isDucked } == ducks.count { !it.isDucked }) { "a duck is still open after the drain: $ducks" }
    check(openInterruption != true) { "a transient interruption is still open after the drain: ${observer.events}" }
    check(!backend.holdsFocus) { "focus is still held after the drain" }
  }

  fun checkInvariants() {
    val holdsFocus = manager.coordinator.heldFocus != null
    check(backend.holdsFocus == holdsFocus) {
      "the backend holds focus = ${backend.holdsFocus}, the coordinator holds focus = $holdsFocus"
    }
    if (scheduler.currentTime - idleSince >= SessionCoordinator.RELEASE_DELAY_MS) {
      check(!backend.holdsFocus) { "focus is still held 1 s after the last use ended" }
    }
    val events = observer.events
    val ducks = events.filterIsInstance<Event.Ducked>()
    ducks.forEachIndexed { index, event ->
      check(event.isDucked == (index % 2 == 0)) { "ducked events do not alternate: $ducks" }
    }
    for (index in checkedEvents until events.size) {
      val event = events[index]
      val useCount = observer.useCounts[index]
      when (event) {
        is Event.FocusLost -> check(events.getOrNull(index + 1) is Event.InterruptionBegan) {
          "focusLost at $index is not followed by interruptionBegan: $events"
        }
        is Event.InterruptionBegan -> {
          check(events.getOrNull(index - 1) is Event.FocusLost) { "began at $index has no focusLost: $events" }
          check(useCount > 0) { "began at $index with no uses: $events" }
          check(openInterruption != true) { "began at $index while a transient interruption is open: $events" }
          check(openInterruption == null || grantedSincePermanent) {
            "began at $index after a permanent loss with no grant in between: $events"
          }
          openInterruption = (events[index - 1] as Event.FocusLost).transient
          grantedSincePermanent = false
        }
        is Event.InterruptionEnded -> {
          check(openInterruption != null) { "ended at $index has no open began: $events" }
          check(!event.shouldResume || useCount > 0) { "ended(shouldResume = true) at $index with no uses: $events" }
          openInterruption = null
        }
        else -> {}
      }
      if (isFocusEvent(event)) {
        val before = events.subList(0, index)
        check(before.indexOfLast { it is Event.Suspended } <= before.indexOfLast { it == Event.Resumed }) {
          "focus event at $index while suspended: $events"
        }
      }
    }
    checkedEvents = events.size
  }

  private fun check(condition: Boolean, message: () -> String) {
    if (!condition) {
      throw AssertionError(message())
    }
  }
}

private class LossModel {
  private enum class State { NONE, DUCKED, TRANSIENT, PERMANENT }

  private var current = State.NONE
  private var reported = State.NONE
  private var held: FocusSpec? = null
  private var delayed = false
  val events = mutableListOf<Event>()

  fun step(facts: StepFacts) {
    if (facts.resumed && facts.uses > 0) {
      held = null
      delayed = false
    }
    val focus = held
    if (facts.callback != null && focus != null) {
      val pauses = focus.pausesWhenDucked || focus.contentType == AudioAttributes.CONTENT_TYPE_SPEECH
      when (facts.callback) {
        AudioManager.AUDIOFOCUS_GAIN -> current = State.NONE
        AudioManager.AUDIOFOCUS_LOSS -> {
          current = if (delayed && reported == State.NONE) {
            State.NONE
          } else {
            State.PERMANENT
          }
          held = null
        }
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> if (!delayed) {
          current = State.TRANSIENT
        }
        else -> if (!delayed && pauses) {
          current = State.TRANSIENT
        } else if (!delayed && current == State.NONE) {
          current = State.DUCKED
        }
      }
      if (facts.callback == AudioManager.AUDIOFOCUS_GAIN || facts.callback == AudioManager.AUDIOFOCUS_LOSS) {
        delayed = false
      }
    }
    for (call in facts.calls) {
      if (call is FakeSessionBackend.Call.Request && !facts.throws) {
        held = call.spec
        delayed = facts.result == FocusResult.DELAYED
        current = if (delayed) {
          current
        } else {
          State.NONE
        }
      } else if (call == FakeSessionBackend.Call.Abandon) {
        held = null
        delayed = false
        current = if (current == State.PERMANENT) {
          current
        } else {
          State.NONE
        }
      }
    }
    if (facts.suspended) {
      return
    }
    if (facts.uses == 0 && current == State.PERMANENT) {
      current = State.NONE
    }
    if (current != reported) {
      when (reported) {
        State.DUCKED -> events.add(Event.Ducked(false))
        State.TRANSIENT -> events.add(
          Event.InterruptionEnded(facts.uses > 0 && current != State.PERMANENT && (held != null || !facts.wantsFocus))
        )
        else -> {}
      }
      reported = if (facts.uses == 0) {
        State.NONE
      } else {
        current
      }
      when (reported) {
        State.DUCKED -> events.add(Event.Ducked(true))
        State.TRANSIENT, State.PERMANENT -> {
          events.add(Event.FocusLost(transient = reported == State.TRANSIENT))
          events.add(Event.InterruptionBegan(InterruptionReason.DEFAULT))
        }
        else -> {}
      }
    }
    if (facts.resumed && current == State.PERMANENT && delayed) {
      current = State.TRANSIENT
      reported = State.TRANSIENT
    }
  }
}
