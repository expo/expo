package expo.modules.updates.procedures

import android.os.Handler
import android.os.HandlerThread
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import kotlin.test.*

@RunWith(AndroidJUnit4ClassRunner::class)
class StateMachineSerialExecutorQueueTest {
  @Test
  fun test_SerialExecution() {
    val latch = CountDownLatch(3)

    class TestStateMachineProcedure : StateMachineProcedure() {
      var executionTime: Long = 0

      override fun run(procedureContext: ProcedureContext) {
        executionTime = System.currentTimeMillis()

        Handler(
          HandlerThread("test-thread").apply {
            start()
          }.looper
        ).postDelayed(
          {
            latch.countDown()
            procedureContext.onComplete()
          },
          100
        )
      }
    }

    val executorQueue = StateMachineSerialExecutorQueue(object : StateMachineProcedure.StateMachineProcedureContext {
      override fun processStateEvent(event: UpdatesStateEvent) {
      }

      @Deprecated("Avoid needing to access current state to know how to transition to next state")
      override fun getCurrentState(): UpdatesStateValue {
        return UpdatesStateValue.Idle
      }

      override fun resetState() {
      }
    })

    val procedure1 = TestStateMachineProcedure()
    val procedure2 = TestStateMachineProcedure()
    val procedure3 = TestStateMachineProcedure()

    executorQueue.queueExecution(procedure1)
    executorQueue.queueExecution(procedure2)
    executorQueue.queueExecution(procedure3)

    latch.await()

    assertTrue { procedure2.executionTime >= procedure1.executionTime + 100 }
    assertTrue { procedure3.executionTime >= procedure2.executionTime + 100 }
  }
}
