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
class UpdatesStateMachine constructor(
  androidContext: Context
) {

  private val logger = UpdatesLogger(androidContext)

  var changeEventSender: UpdatesStateChangeEventSender? = null

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
    logger?.info("Updates state change: reset, context = ${context.json}")
    sendChangeEventToJS()
  }

  /**
   Called by LoaderTask delegate methods in UpdatesController during the initial
   background check for updates, and called by checkForUpdateAsync(), fetchUpdateAsync(), and reloadAsync().
   */
  fun processEvent(event: UpdatesStateEvent) {
    if (transition(event)) {
      context = reducedContext(context, event)
      logger?.info("Updates state change: ${event.type}, context = ${context.json}")
      // Send change event
      sendChangeEventToJS(event)
    }
  }

  /**
   Make sure the state transition is allowed, and then update the state.
   */
  private fun transition(event: UpdatesStateEvent): Boolean {
    val allowedEvents: List<UpdatesStateEventType> = updatesStateAllowedEvents[state] ?: listOf()
    if (!allowedEvents.contains(event.type)) {
      // Optionally put an assert here when testing to catch bad state transitions in E2E tests
      return false
    }
    state = updatesStateTransitions[event.type] ?: UpdatesStateValue.Idle
    return true
  }

  /**
   * Given an allowed event and a context, return a new context with the changes
   * made by processing the event.
   */
  private fun reducedContext(context: UpdatesStateContext, event: UpdatesStateEvent): UpdatesStateContext {
    val newContext = UpdatesStateContext(
      context.isUpdateAvailable,
      context.isUpdatePending,
      context.isRollback,
      context.isChecking,
      context.isDownloading,
      context.isRestarting,
      context.latestManifest,
      context.downloadedManifest,
      context.checkError,
      context.downloadError
    )
    when (event.type) {
      UpdatesStateEventType.Check -> {
        newContext.isChecking = true
      }
      UpdatesStateEventType.CheckCompleteUnavailable -> {
        newContext.isChecking = false
        newContext.checkError = null
        newContext.latestManifest = null
        newContext.isUpdateAvailable = false
        newContext.isRollback = false
      }
      UpdatesStateEventType.CheckCompleteAvailable -> {
        newContext.isChecking = false
        newContext.checkError = null
        newContext.latestManifest = event.manifest
        newContext.isRollback = event.isRollback
        newContext.isUpdateAvailable = true
      }
      UpdatesStateEventType.CheckError -> {
        newContext.isChecking = false
        newContext.checkError = event.error
      }
      UpdatesStateEventType.Download -> {
        newContext.isDownloading = true
      }
      UpdatesStateEventType.DownloadComplete -> {
        newContext.isDownloading = false
        newContext.downloadError = null
        newContext.latestManifest = event.manifest ?: context.latestManifest
        newContext.downloadedManifest = event.manifest ?: context.downloadedManifest
        newContext.isUpdatePending = newContext.downloadedManifest != null
        newContext.isUpdateAvailable = when (event.manifest) {
          null -> context.isUpdateAvailable
          else -> true
        }
      }
      UpdatesStateEventType.DownloadError -> {
        newContext.isDownloading = false
        newContext.downloadError = event.error
      }
      UpdatesStateEventType.Restart -> {
        newContext.isRestarting = true
      }
    }
    return newContext
  }

  /**
   * If a state change event is passed in, the JS sender
   * is called with just the fields and values that changed.
   * During a reset, this method is called with no event passed in,
   * and then all the fields and the entire context are passed to the JS sender.
   */
  private fun sendChangeEventToJS(event: UpdatesStateEvent? = null) {
    changeEventSender?.sendUpdateStateChangeEventToBridge(
      event?.type ?: UpdatesStateEventType.Restart,
      context.json
    )
  }

  companion object {
    /**
     For a particular machine state, only certain events may be processed.
     */
    val updatesStateAllowedEvents: Map<UpdatesStateValue, List<UpdatesStateEventType>> = mapOf(
      UpdatesStateValue.Idle to listOf(UpdatesStateEventType.Check, UpdatesStateEventType.Download, UpdatesStateEventType.Restart),
      UpdatesStateValue.Checking to listOf(UpdatesStateEventType.CheckCompleteAvailable, UpdatesStateEventType.CheckCompleteUnavailable, UpdatesStateEventType.CheckError),
      UpdatesStateValue.Downloading to listOf(UpdatesStateEventType.DownloadComplete, UpdatesStateEventType.DownloadError),
      UpdatesStateValue.Restarting to listOf()
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
     * Creates a WritableMap to be sent to JS on a state change.
     */
    fun paramsForJSEvent(context: Map<String, Any>): WritableMap {
      val contextMap = Arguments.createMap()
      for (field: String in context.keys) {
        if (field.startsWith("is")) {
          contextMap.putBoolean(field, context[field] as Boolean)
        } else if (field.endsWith("Manifest")) {
          if (context[field] != null) {
            contextMap.putString("${field}String", (context[field] as JSONObject).toString())
          } else {
            contextMap.putNull(field)
          }
        } else { // errors
          if (context[field] != null) {
            val errorMap = Arguments.createMap()
            errorMap.putString("message", (context[field] as Map<*, *>)["message"] as String)
            contextMap.putMap(field, errorMap)
          } else {
            contextMap.putNull(field)
          }
        }
      }
      val params = Arguments.createMap()
      params.putMap("context", contextMap)
      return params
    }
  }
}
