package expo.modules.updates.procedures

import expo.modules.core.logging.LoggerTimer
import expo.modules.updates.logging.IUpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Before
import org.junit.Test
import kotlin.test.*
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

@OptIn(ExperimentalCoroutinesApi::class)
class StateMachineSerialExecutorQueueTest {
  private lateinit var testScope: TestScope
  private lateinit var testScheduler: TestCoroutineScheduler

  @Before
  fun setup() {
    testScheduler = TestCoroutineScheduler()
    testScope = TestScope(StandardTestDispatcher(testScheduler))
    Dispatchers.setMain(StandardTestDispatcher(testScheduler))
  }

  class TestStateMachineProcedureContext : StateMachineProcedure.StateMachineProcedureContext {
    override fun processStateEvent(event: UpdatesStateEvent) {
      println("TestStateMachineProcedureContext processStateEvent: $event")
    }

    @Deprecated("Avoid needing to access current state to know how to transition to next state")
    override fun getCurrentState(): UpdatesStateValue {
      println("TestStateMachineProcedureContext getCurrentState")
      return UpdatesStateValue.Idle
    }

    override fun resetStateAfterRestart() {
      println("TestStateMachineProcedureContext resetStateAfterRestart")
    }
  }

  class TestUpdatesLogger : IUpdatesLogger {
    override fun startTimer(label: String): LoggerTimer {
      val start = System.currentTimeMillis()
      return object : LoggerTimer {
        override fun stop(): Duration {
          val end = System.currentTimeMillis()
          val duration = end - start
          return duration.toDuration(DurationUnit.MILLISECONDS)
        }
      }
    }
  }

  inner class TestStateMachineProcedure(
    private val onRun: suspend (ProcedureContext) -> Unit
  ) : StateMachineProcedure() {
    override val loggerTimerLabel = "timer-test"

    override suspend fun run(procedureContext: ProcedureContext) {
      println("TestStateMachineProcedure run: $this")
      onRun(procedureContext)
    }
  }

  @Test
  fun test_SerialExecution() = runTest(testScheduler) {
    val procedureChannel = Channel<Long>(Channel.UNLIMITED)
    val logger = TestUpdatesLogger()

    val procedureContext = TestStateMachineProcedureContext()
    val executorQueue = StateMachineSerialExecutorQueue(logger, procedureContext, testScope)

    val procedure1 = TestStateMachineProcedure {
      val currentTime = testScheduler.currentTime
      procedureChannel.send(currentTime)
      delay(100)
      it.onComplete()
    }
    val procedure2 = TestStateMachineProcedure {
      val currentTime = testScheduler.currentTime
      procedureChannel.send(currentTime)
      delay(300)
      it.onComplete()
    }
    val procedure3 = TestStateMachineProcedure {
      val currentTime = testScheduler.currentTime
      procedureChannel.send(currentTime)
      delay(100)
      it.onComplete()
    }

    executorQueue.queueExecution(procedure1)
    executorQueue.queueExecution(procedure2)
    executorQueue.queueExecution(procedure3)

    advanceUntilIdle()

    val executionTime1 = procedureChannel.receive()
    val executionTime2 = procedureChannel.receive()
    val executionTime3 = procedureChannel.receive()

    assertTrue { executionTime2 >= executionTime1 + 100 }
    assertTrue { executionTime3 >= executionTime2 + 300 }
  }
}
