package expo.modules.updates.statemachine

import android.content.Context
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.procedures.StateMachineProcedure
import expo.modules.updates.procedures.StateMachineSerialExecutorQueue
import java.util.Date

/**
 * The Updates state machine class. There should be only one instance of this class
 * in a production app, instantiated as a property of UpdatesController.
 */
class UpdatesStateMachine(
  androidContext: Context,
  private val changeEventSender: UpdatesStateChangeEventSender,
  private val validUpdatesStateValues: Set<UpdatesStateValue>
) {
  private val logger = UpdatesLogger(androidContext)

  private val serialExecutorQueue = StateMachineSerialExecutorQueue(
    logger,
    object : StateMachineProcedure.StateMachineProcedureContext {
      override fun processStateEvent(event: UpdatesStateEvent) {
        this@UpdatesStateMachine.processEvent(event)
      }

      override fun getCurrentState(): UpdatesStateValue {
        return state
      }

      override fun resetState() {
        reset()
      }
    }
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
  private fun reset() {
    state = UpdatesStateValue.Idle
    context = UpdatesStateContext()
    logger.info("Updates state change: reset, context = ${context.json}")
    sendChangeEventToJS(UpdatesStateEvent.Restart())
  }

  /**
   * Transition the state machine forward to a new state.
   */
  private fun processEvent(event: UpdatesStateEvent) {
    if (transition(event)) {
      context = reduceContext(context, event)
      logger.info("Updates state change: ${event.type}, context = ${context.json}")
      // Send change event
      sendChangeEventToJS(event)
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

  private fun sendChangeEventToJS(event: UpdatesStateEvent) {
    changeEventSender.sendUpdateStateChangeEventToAppContext(
      event.type,
      context.copy()
    )
  }

  companion object {
    /**
     For a particular machine state, only certain events may be processed.
     */
    val updatesStateAllowedEvents: Map<UpdatesStateValue, Set<UpdatesStateEventType>> = mapOf(
      UpdatesStateValue.Idle to setOf(UpdatesStateEventType.Check, UpdatesStateEventType.Download, UpdatesStateEventType.Restart),
      UpdatesStateValue.Checking to setOf(UpdatesStateEventType.CheckCompleteAvailable, UpdatesStateEventType.CheckCompleteUnavailable, UpdatesStateEventType.CheckError),
      UpdatesStateValue.Downloading to setOf(UpdatesStateEventType.DownloadComplete, UpdatesStateEventType.DownloadError),
      UpdatesStateValue.Restarting to setOf()
    )

    /**
     For this state machine, each event has only one destination state that the
     machine will transition to.
     */
    val updatesStateTransitions: Map<UpdatesStateEventType, UpdatesStateValue> = mapOf(
      UpdatesStateEventType.Check to UpdatesStateValue.Checking,
      UpdatesStateEventType.CheckCompleteAvailable to UpdatesStateValue.Idle,
      UpdatesStateEventType.CheckCompleteUnavailable to UpdatesStateValue.Idle,
      UpdatesStateEventType.CheckError to UpdatesStateValue.Idle,
      UpdatesStateEventType.Download to UpdatesStateValue.Downloading,
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
        is UpdatesStateEvent.Check -> context.copy(isChecking = true)
        is UpdatesStateEvent.CheckCompleteUnavailable -> context.copy(
          isChecking = false,
          checkError = null,
          latestManifest = null,
          rollback = null,
          isUpdateAvailable = false,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.CheckCompleteWithRollback -> context.copy(
          isChecking = false,
          checkError = null,
          latestManifest = null,
          rollback = UpdatesStateContextRollback(event.commitTime),
          isUpdateAvailable = true,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.CheckCompleteWithUpdate -> context.copy(
          isChecking = false,
          checkError = null,
          latestManifest = event.manifest,
          rollback = null,
          isUpdateAvailable = true,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.CheckError -> context.copy(
          isChecking = false,
          checkError = event.error,
          lastCheckForUpdateTime = Date()
        )
        is UpdatesStateEvent.Download -> context.copy(isDownloading = true)
        is UpdatesStateEvent.DownloadComplete -> context.copy(
          isDownloading = false,
          downloadError = null,
          isUpdatePending = true
        )
        is UpdatesStateEvent.DownloadCompleteWithRollback -> context.copy(
          isDownloading = false,
          downloadError = null,
          isUpdatePending = true
        )
        is UpdatesStateEvent.DownloadCompleteWithUpdate -> context.copy(
          isDownloading = false,
          downloadError = null,
          latestManifest = event.manifest,
          downloadedManifest = event.manifest,
          rollback = null,
          isUpdatePending = true,
          isUpdateAvailable = true
        )
        is UpdatesStateEvent.DownloadError -> context.copy(
          isDownloading = false,
          downloadError = event.error
        )
        is UpdatesStateEvent.Restart -> context.copy(
          isRestarting = true
        )
      }
    }
  }
}
