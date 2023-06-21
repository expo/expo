package expo.modules.updates.statemachine

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import expo.modules.updates.logging.UpdatesLogger
import org.json.JSONObject

/**
 * The Updates state machine class. There should be only one instance of this class
 * in a production app, instantiated as a property of UpdatesController.
 */
class UpdatesStateMachine(
  androidContext: Context,
  val changeEventSender: UpdatesStateChangeEventSender
) {

  private val logger = UpdatesLogger(androidContext)

  /**
   * The current state
   */
  var state: UpdatesStateValue = UpdatesStateValue.Idle

  /**
   * The context
   */
  var context: UpdatesStateContext = UpdatesStateContext()

  /**
   Called after the app restarts (reloadAsync()) to reset the machine to its
   starting state.
   */
  fun reset() {
    state = UpdatesStateValue.Idle
    context = UpdatesStateContext()
    logger.info("Updates state change: reset, context = ${context.json}")
    sendChangeEventToJS()
  }

  /**
   Called by LoaderTask delegate methods in UpdatesController during the initial
   background check for updates, and called by checkForUpdateAsync(), fetchUpdateAsync(), and reloadAsync().
   */
  fun processEvent(event: UpdatesStateEvent) {
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
      // Optionally put an assert here when testing to catch bad state transitions in E2E tests
      return false
    }
    state = updatesStateTransitions[event.type] ?: UpdatesStateValue.Idle
    return true
  }

  /**
   * If a state change event is passed in, the JS sender
   * is called with just the fields and values that changed.
   * During a reset, this method is called with no event passed in,
   * and then all the fields and the entire context are passed to the JS sender.
   */
  private fun sendChangeEventToJS(event: UpdatesStateEvent? = null) {
    changeEventSender.sendUpdateStateChangeEventToBridge(
      event?.type ?: UpdatesStateEventType.Restart,
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
      return when (event.type) {
        UpdatesStateEventType.Check -> context.copy(isChecking = true)
        UpdatesStateEventType.CheckCompleteUnavailable -> context.copy(
          isChecking = false,
          checkError = null,
          latestManifest = null,
          isUpdateAvailable = false,
          isRollback = false
        )
        UpdatesStateEventType.CheckCompleteAvailable -> context.copy(
          isChecking = false,
          checkError = null,
          latestManifest = event.manifest,
          isUpdateAvailable = true,
          isRollback = event.isRollback
        )
        UpdatesStateEventType.CheckError -> context.copy(
          isChecking = false,
          checkError = event.error
        )
        UpdatesStateEventType.Download -> context.copy(isDownloading = true)
        UpdatesStateEventType.DownloadComplete -> context.copy(
          isDownloading = false,
          downloadError = null,
          latestManifest = event.manifest ?: context.latestManifest,
          downloadedManifest = event.manifest ?: context.downloadedManifest,
          isUpdatePending = true,
          isUpdateAvailable = when (event.manifest) {
            null -> context.isUpdateAvailable
            else -> true
          }
        )
        UpdatesStateEventType.DownloadError -> context.copy(
          isDownloading = false,
          downloadError = event.error
        )
        UpdatesStateEventType.Restart -> context.copy(
          isRestarting = true
        )
      }
    }
  }
}
