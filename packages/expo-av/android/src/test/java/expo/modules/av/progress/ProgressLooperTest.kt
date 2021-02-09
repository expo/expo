package expo.modules.av.progress

import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.spyk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ProgressLooperTest {

  interface TestTimeMachine : TimeMachine {
    fun advanceBy(interval: Long)
    fun triggerListeners(by: Long = Long.MAX_VALUE)
  }

  object TimeMachineInstance : TestTimeMachine {

    override var time = 0L

    var callbacks: Map<TimeMachineTick, Long> = HashMap()

    override fun advanceBy(interval: Long) {
      time += interval
    }

    override fun triggerListeners(by: Long) {
      val toInvoke = callbacks.filter { it.value < by }
      callbacks = callbacks.filter { it.value >= by }
      toInvoke.forEach {
        it.key()
      }
    }

    override fun scheduleAt(intervalMillis: Long, callback: TimeMachineTick) {
      if (intervalMillis > 0) {
        callbacks = callbacks.plus(callback to time + intervalMillis)
      }
    }

    fun reset() {
      callbacks = HashMap()
      time = 0
    }
  }

  lateinit var looper: ProgressLooper
  lateinit var callback: TimeMachineTick
  lateinit var timeMachine: TestTimeMachine

  @BeforeEach
  fun setUp() {
    TimeMachineInstance.reset()
    timeMachine = spyk(TimeMachineInstance)
    looper = ProgressLooper(timeMachine)
    callback = mockk()
    every { callback() } just Runs
  }

  @Test
  fun `callback not invoked prematurely`() {
    looper.loop(1000, callback)
    verify(exactly = 0) { callback() }
  }

  @Test
  fun `callback invoked once after time passed`() {
    looper.loop(1000L, callback)
    timeMachine.advanceBy(1000L)
    timeMachine.triggerListeners()
    verify(exactly = 1) { callback() }
  }

  @Test
  fun `callback invoked twice after two timeouts`() {
    looper.loop(1000, callback)
    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()
    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()
    verify(exactly = 2) { callback() }
  }

  @Test
  fun `callback invoked once after twice too big timeout`() {
    looper.loop(1000, callback)
    timeMachine.advanceBy(2200)
    timeMachine.triggerListeners(2200)
    verify(exactly = 1) { callback() }
  }

  @Test
  fun `callback not invoked after looping stopped`() {
    looper.loop(1000L, callback)
    timeMachine.advanceBy(1001)
    timeMachine.triggerListeners()
    verify(exactly = 1) { callback() }
    looper.stopLooping()
    timeMachine.advanceBy(1001)
    timeMachine.triggerListeners()
    verify(exactly = 1) { callback() }
  }

  @Test
  fun `callback not invoked earlier if interval shortened`() {
    looper.loop(1000L, callback)

    looper.loop(100, callback)
    timeMachine.advanceBy(110)
    timeMachine.triggerListeners(110)
    verify(exactly = 0) { callback() }

    timeMachine.advanceBy(900)
    timeMachine.triggerListeners(1010)
    verify(exactly = 1) { callback() }

    timeMachine.advanceBy(100)
    timeMachine.triggerListeners(1110)
    verify(exactly = 2) { callback() }
  }

  @Test
  fun `callback invoked earlier even if interval lengthened`() {
    looper.loop(1000, callback)

    looper.loop(2000, callback)
    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners(1100)

    verify(exactly = 1) { callback() }
  }

  @Test
  fun `callback not invoked later even if interval lengthened`() {
    looper.loop(1000, callback)

    looper.loop(2000, callback)
    timeMachine.advanceBy(1110)
    timeMachine.triggerListeners(1100)

    verify(exactly = 1) { callback() }

    timeMachine.advanceBy(1110)
    timeMachine.triggerListeners(2200)

    verify(exactly = 1) { callback() }
  }

  @Test
  fun `next tick scheduled with adjustment to passed time when invoked too late`() {
    looper.loop(1000L, callback)

    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners(1100)

    verify(exactly = 1) { timeMachine.scheduleAt(900, any()) }
  }

  @Test
  fun `next tick scheduled with adjustment to passed time when invoked too early`() {
    looper.loop(1000L, callback)

    timeMachine.advanceBy(900)
    timeMachine.triggerListeners()

    verify(exactly = 1) { timeMachine.scheduleAt(1100, any()) }
  }

  @Test
  fun `old listener not notified after new is registered`() {
    looper.loop(1000, callback)

    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()
    verify(exactly = 1) { callback() }

    looper.setListener { }
    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()

    verify(exactly = 1) { callback() }
  }

  @Test
  fun `new listener is notified after registration`() {
    looper.loop(1000) { }

    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()
    looper.setListener(callback)
    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()

    verify(exactly = 1) { callback() }
  }

  @Test
  fun `time machine not called if no looping started`() {
    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()

    verify(exactly = 0) { timeMachine.scheduleAt(any(), any()) }
  }

  @Test
  fun `time machine not called after looping stopped`() {
    looper.loop(1000) {}
    verify(exactly = 1) { timeMachine.scheduleAt(any(), any()) }

    timeMachine.advanceBy(1100)
    timeMachine.triggerListeners()
    verify(exactly = 2) { timeMachine.scheduleAt(any(), any()) }

    looper.stopLooping()
    timeMachine.advanceBy(100000)
    timeMachine.triggerListeners()
    verify(exactly = 2) { timeMachine.scheduleAt(any(), any()) }
  }

}
