package expo.modules.updates.procedures

import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * A serial task queue, where each task is an asynchronous task. Guarantees that all queued tasks
 * are run sequentially.
 */
class StateMachineSerialExecutorQueue(
  private val stateMachineProcedureContext: StateMachineProcedure.StateMachineProcedureContext
) {

  data class MethodInvocationHolder<T>(val procedure: StateMachineProcedure<T>, val coroutineScope: CoroutineScope) {
    suspend fun execute(procedureContext: StateMachineProcedure.StateMachineProcedureContext): T {
      return procedure.run(object : StateMachineProcedure.ProcedureContext {
        // TODO(wschurman) check if coroutine disposed instead of isComplete

        override fun processStateEvent(event: UpdatesStateEvent) {
          procedureContext.processStateEvent(event)
        }

        @Deprecated("Avoid needing to access current state to know how to transition to next state")
        override fun getCurrentState(): UpdatesStateValue {
          return procedureContext.getCurrentState()
        }

        override fun resetState() {
          procedureContext.resetState()
        }
      })
    }
  }

  data class MethodInvocation(val methodInvocationHolder: MethodInvocationHolder<*>, val onComplete: (result: Any?) -> Unit)
  private val internalQueue = ArrayDeque<MethodInvocation>()

  private var currentMethodInvocation: MethodInvocation? = null

  /**
   * Queue a procedure for execution.
   */
  suspend fun <T>queueExecution(stateMachineProcedure: StateMachineProcedure<T>): T {
    return coroutineScope {
      suspendCancellableCoroutine { callback ->
        internalQueue.add(MethodInvocation(
          MethodInvocationHolder(stateMachineProcedure, this)
        ) {
          callback.resume(it as T)
          currentMethodInvocation = null
          maybeProcessQueue()
        })

        maybeProcessQueue()
      }
    }
  }

  private fun maybeProcessQueue() {
    if (currentMethodInvocation != null) {
      return
    }

    val nextMethodInvocation = internalQueue.removeFirstOrNull() ?: return
    currentMethodInvocation = nextMethodInvocation

    nextMethodInvocation.methodInvocationHolder.coroutineScope.launch {
      val result = nextMethodInvocation.methodInvocationHolder.execute(stateMachineProcedureContext) // need to make sure this is asynchronous
      nextMethodInvocation.onComplete(result)
    }
  }
}
