package expo.modules.updates.statemachine

import expo.modules.updates.events.IUpdatesEventManager
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.procedures.StateMachineProcedure
import expo.modules.updates.procedures.StateMachineSerialExecutorQueue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import java.util.Date

/**
 * The Updates state machine class. There should be only one instance of this class
 * in a production app, instantiated as a property of UpdatesController.
 */
class UpdatesStateMachine(
  private val logger: UpdatesLogger,
  private val eventManager: IUpdatesEventManager,
  private val validUpdatesStateValues: Set<UpdatesStateValue>,
  scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) {
  private val serialExecutorQueue = StateMachineSerialExecutorQueue(
    logger,
    object : StateMachineProcedure.StateMachineProcedureContext {
      override fun processStateEvent(event: UpdatesStateEvent) {
        this@UpdatesStateMachine.processEvent(event)
      }

      @Deprecated("Avoid needing to access current state to know how to transition to next state")
      override fun getCurrentState(): UpdatesStateValue {
        return state
      }

      override fun resetStateAfterRestart() {
        resetAndIncrementRestartCount()
      }
    },
    scope
  )

  /**
   * Queue a StateMachineProcedure procedure for serial execution.
   */
  fun queueExecution(stateMachineProcedure: StateMachineProcedure) {
    serialExecutorQueue.queueExecution(stateMachineProcedure)
  }

  /**
   * The current state
   */
  private var state: UpdatesStateValue = UpdatesStateValue.Idle

  /**
   * The context
   */
  var context: UpdatesStateContext = UpdatesStateContext()
    private set

  /**
   * Reset the machine to its starting state. Should only be called after the app restarts (reloadAsync()).
   */
  private fun resetAndIncrementRestartCount() {
    state = UpdatesStateValue.Idle
    context = context.resetCopyWithIncrementedRestartCountAndSequenceNumber()
    logger.info("Updates state change: reset, context = ${context.json}")
    sendContextToJS()
  }

  /**
   * Transition the state machine forward to a new state.
   */
  private fun processEvent(event: UpdatesStateEvent) {
    if (transition(event)) {
      context = reduceContext(context, event)
      logger.info("Updates state change: ${event.type}, context = ${context.json}")
      sendContextToJS()
    }
  }

  /**
   Make sure the state transition is allowed, and then update the state.
   */
  private fun transition(event: UpdatesStateEvent): Boolean {
    val allowedEvents: Set<UpdatesStateEventType> = updatesStateAllowedEvents[state] ?: setOf()
    if (!allowedEvents.contains(event.type)) {
      assert(false) { "UpdatesState: invalid transition requested: state = $state, event = ${event.type}" }
      return false
    }
    val newStateValue = updatesStateTransitions[event.type] ?: UpdatesStateValue.Idle
    if (!validUpdatesStateValues.contains(newStateValue)) {
      assert(false) { "UpdatesState: invalid transition requested: state = $state, event = ${event.type}" }
      return false
    }
    state = newStateValue
    return true
  }

  fun sendContextToJS() {
    eventManager.sendStateMachineContextEvent(context)
  }

  companion object {
    /**
     For a particular machine state, only certain events may be processed.
     */
    val updatesStateAllowedEvents: Map<UpdatesStateValue, Set<UpdatesStateEventType>> = mapOf(
      UpdatesStateValue.Idle to setOf(UpdatesStateEventType.StartStartup, UpdatesStateEventType.EndStartup, UpdatesStateEventType.Check, UpdatesStateEventType.Download, UpdatesStateEventType.Restart),
      UpdatesStateValue.Checking to setOf(UpdatesStateEventType.CheckCompleteAvailable, UpdatesStateEventType.CheckCompleteUnavailable, UpdatesStateEventType.CheckError),
      UpdatesStateValue.Downloading to setOf(UpdatesStateEventType.DownloadComplete, UpdatesStateEventType.DownloadError, UpdatesStateEventType.DownloadProgress),
      UpdatesStateValue.Restarting to setOf()
    )

    /**
     For this state machine, each event has only one destination state that the
     machine will transition to.
     */
    val updatesStateTransitions: Map<UpdatesStateEventType, UpdatesStateValue> = mapOf(
      UpdatesStateEventType.StartStartup to UpdatesStateValue.Idle,
      UpdatesStateEventType.EndStartup to UpdatesStateValue.Idle,
      UpdatesStateEventType.Check to UpdatesStateValue.Checking,
      UpdatesStateEventType.CheckCompleteAvailable to UpdatesStateValue.Idle,
      UpdatesStateEventType.CheckCompleteUnavailable to UpdatesStateValue.Idle,
      UpdatesStateEventType.CheckError to UpdatesStateValue.Idle,
      UpdatesStateEventType.Download to UpdatesStateValue.Downloading,
      UpdatesStateEventType.DownloadProgress to UpdatesStateValue.Downloading,
      UpdatesStateEventType.DownloadComplete to UpdatesStateValue.Idle,
      UpdatesStateEventType.DownloadError to UpdatesStateValue.Idle,
      UpdatesStateEventType.Restart to UpdatesStateValue.Restarting
    )

    /**
     * Given an allowed event and a context, return a new context with the changes
     * made by processing the event.
     */
    private fun reduceContext(context: UpdatesStateContext, event: UpdatesStateEvent): UpdatesStateContext {
      return when (event) {
        is UpdatesStateEvent.StartStartup -> context.copyAndIncrementSequenceNumber(
          isStartupProcedureRunning = true
        )
        is UpdatesStateEvent.EndStartup -> context.copyAndIncrementSequenceNumber(
          isStartupProcedureRunning = false
        )
        is UpdatesStateEvent.Check -> context.copyAndIncrementSequenceNumber(
          isChecking = true
        )
        is UpdatesStateEvent.CheckCompleteUnavailable -> context.copyAndIncrementSequenceNumber(
          isChecking = false,
          checkError = null,
          latestManifest = null,
          rollback = null,
          isUpdateAvailable = false,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.CheckCompleteWithRollback -> context.copyAndIncrementSequenceNumber(
          isChecking = false,
          checkError = null,
          latestManifest = null,
          rollback = UpdatesStateContextRollback(event.commitTime),
          isUpdateAvailable = true,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.CheckCompleteWithUpdate -> context.copyAndIncrementSequenceNumber(
          isChecking = false,
          checkError = null,
          latestManifest = event.manifest,
          rollback = null,
          isUpdateAvailable = true,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.CheckError -> context.copyAndIncrementSequenceNumber(
          isChecking = false,
          checkError = event.error,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.Download -> context.copyAndIncrementSequenceNumber(
          downloadProgress = 0.0,
          isDownloading = true
        )
        is UpdatesStateEvent.DownloadProgress -> context.copyAndIncrementSequenceNumber(
          downloadProgress = event.progress
        )
        is UpdatesStateEvent.DownloadComplete -> context.copyAndIncrementSequenceNumber(
          isDownloading = false,
          downloadError = null,
          isUpdatePending = true,
          downloadProgress = 1.0
        )
        is UpdatesStateEvent.DownloadCompleteWithRollback -> context.copyAndIncrementSequenceNumber(
          isDownloading = false,
          downloadError = null,
          isUpdatePending = true
        )
        is UpdatesStateEvent.DownloadCompleteWithUpdate -> context.copyAndIncrementSequenceNumber(
          isDownloading = false,
          downloadError = null,
          latestManifest = event.manifest,
          downloadedManifest = event.manifest,
          rollback = null,
          isUpdatePending = true,
          isUpdateAvailable = true
        )
        is UpdatesStateEvent.DownloadError -> context.copyAndIncrementSequenceNumber(
          isDownloading = false,
          downloadError = event.error
        )
        is UpdatesStateEvent.Restart -> context.copyAndIncrementSequenceNumber(
          isRestarting = true
        )
      }
    }
  }
}
