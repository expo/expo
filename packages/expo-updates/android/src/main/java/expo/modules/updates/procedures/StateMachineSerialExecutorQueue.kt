package expo.modules.updates.procedures

import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue

/**
 * A serial task queue, where each task is an asynchronous task. Guarantees that all queued tasks
 * are run sequentially.
 */
class StateMachineSerialExecutorQueue(private val stateMachineProcedureContext: StateMachineProcedure.StateMachineProcedureContext) {
  private data class MethodInvocationHolder(val procedure: StateMachineProcedure, val onMethodInvocationComplete: MethodInvocationHolder.() -> Unit) {
    fun execute(procedureContext: StateMachineProcedure.StateMachineProcedureContext) {
      procedure.run(object : StateMachineProcedure.ProcedureContext {
        private var isCompleted = false

        override fun onComplete() {
          isCompleted = true
          onMethodInvocationComplete(this@MethodInvocationHolder)
        }

        override fun processStateEvent(event: UpdatesStateEvent) {
          if (isCompleted) {
            throw Exception("Cannot set state after procedure completion")
          }
          procedureContext.processStateEvent(event)
        }

        @Deprecated("Avoid needing to access current state to know how to transition to next state")
        override fun getCurrentState(): UpdatesStateValue {
          if (isCompleted) {
            throw Exception("Cannot get state after procedure completion")
          }
          return procedureContext.getCurrentState()
        }

        override fun resetState() {
          if (isCompleted) {
            throw Exception("Cannot reset state after procedure completion")
          }
          procedureContext.resetState()
        }
      })
    }
  }

  private val internalQueue = ArrayDeque<MethodInvocationHolder>()

  private var currentMethodInvocation: MethodInvocationHolder? = null

  /**
   * Queue a procedure for execution.
   */
  fun queueExecution(stateMachineProcedure: StateMachineProcedure) {
    internalQueue.add(
      MethodInvocationHolder(stateMachineProcedure) {
        assert(currentMethodInvocation == this)
        currentMethodInvocation = null
        maybeProcessQueue()
      }
    )

    maybeProcessQueue()
  }

  @Synchronized
  private fun maybeProcessQueue() {
    if (currentMethodInvocation != null) {
      return
    }

    val nextMethodInvocation = internalQueue.removeFirstOrNull() ?: return
    currentMethodInvocation = nextMethodInvocation
    nextMethodInvocation.execute(stateMachineProcedureContext) // need to make sure this is asynchronous
  }
}
