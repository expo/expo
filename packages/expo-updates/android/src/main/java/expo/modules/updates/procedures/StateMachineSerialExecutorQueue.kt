package expo.modules.updates.procedures

import expo.modules.updates.logging.IUpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * A serial task queue, where each task is an asynchronous task. Guarantees that all queued tasks
 * are run sequentially.
 */
class StateMachineSerialExecutorQueue(
  private val updatesLogger: IUpdatesLogger,
  private val stateMachineProcedureContext: StateMachineProcedure.StateMachineProcedureContext,
  private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) {
  private data class ProcedureHolder(
    val procedure: StateMachineProcedure,
    val onComplete: CompletableDeferred<Unit>
  )

  private val procedureChannel = Channel<ProcedureHolder>(Channel.UNLIMITED)
  private val mutex = Mutex()

  init {
    scope.launch {
      for (holder in procedureChannel) {
        executeProcedure(holder)
      }
    }
  }

  private suspend fun executeProcedure(holder: ProcedureHolder) {
    val loggerTimer = updatesLogger.startTimer(holder.procedure.loggerTimerLabel)
    holder.procedure.run(object : StateMachineProcedure.ProcedureContext {
      private var isCompleted = false

      override fun onComplete() {
        isCompleted = true
        loggerTimer.stop()
        holder.onComplete.complete(Unit)
      }

      override fun processStateEvent(event: UpdatesStateEvent) {
        if (isCompleted) {
          throw Exception("Cannot set state after procedure completion")
        }
        stateMachineProcedureContext.processStateEvent(event)
      }

      @Deprecated("Avoid needing to access current state to know how to transition to next state")
      override fun getCurrentState(): UpdatesStateValue {
        if (isCompleted) {
          throw Exception("Cannot get state after procedure completion")
        }
        return stateMachineProcedureContext.getCurrentState()
      }

      override fun resetStateAfterRestart() {
        if (isCompleted) {
          throw Exception("Cannot reset state after procedure completion")
        }
        stateMachineProcedureContext.resetStateAfterRestart()
      }
    })
    holder.onComplete.await()
  }

  /**
   * Queue a procedure for execution.
   */
  fun queueExecution(stateMachineProcedure: StateMachineProcedure) {
    scope.launch {
      mutex.withLock {
        val completableDeferred = CompletableDeferred<Unit>()
        procedureChannel.send(ProcedureHolder(stateMachineProcedure, completableDeferred))
      }
    }
  }
}
