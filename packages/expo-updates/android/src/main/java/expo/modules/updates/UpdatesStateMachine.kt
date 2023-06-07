package expo.modules.updates

import android.os.Bundle
import expo.modules.manifests.core.Manifest

/**
Protocol with a method for sending state change events to JS.
In production, this will be implemented by the AppController.sharedInstance.
 */
interface UpdatesStateChangeEventSender {
  fun sendUpdateStateChangeEventToBridge(eventType: UpdatesStateEventType, body: Bundle = Bundle())
}

/**
All the possible states the machine can take.
 */
enum class UpdatesStateValue(val value: String) {
  Idle("idle"),
  Checking("checking"),
  Downloading("downloading"),
  Restarting("restarting")
}

/**
All the possible types of events that can be sent to the machine. Each event
will cause the machine to transition to a new state.
 */
enum class UpdatesStateEventType(val type: String) {
  Check("check"),
  CheckCompleteUnavailable("checkCompleteUnavailable"),
  CheckCompleteAvailable("checkCompleteAvailable"),
  CheckError("checkError"),
  Download("download"),
  DownloadComplete("downloadComplete"),
  DownloadError("downloadError"),
  Restart("restart")
}

/**
For a particular machine state, only certain events may be processed.
If the machine receives an unexpected event, an assertion failure will occur
and the app will crash.
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
Structure representing an event that can be sent to the machine.
Convenience getters are provided to get derived properties that will be
used to modify the context when the machine processes an event.
 */
data class UpdatesStateEvent(
  val type: UpdatesStateEventType,
  val body: Map<String, Any> = mapOf()
) {
  val manifest: Manifest?
    get() {
      return body["manifest"] as? Manifest
    }
  val error: Error?
    get() {
      val message = body["message"] as? String?
      return if (message != null) {
        Error(message)
      } else {
        null
      }
    }
  val isRollback: Boolean
    get() {
      return body["isRollBackToEmbedded"] as? Boolean ?: false
    }
  val changedProperties: ArrayList<String>
    get() {
      return updatesStateEventChangedProperties[type]?.let { ArrayList(it) }
        ?: ArrayList(UpdatesStateContext.allProps)
    }
  companion object {
    /**
     For each event type, an array with the names of the context properties that change
     when that event is processed.
     */
    val updatesStateEventChangedProperties: Map<UpdatesStateEventType, List<String>> = mapOf(
      UpdatesStateEventType.Check to listOf("isChecking"),
      UpdatesStateEventType.CheckCompleteAvailable to listOf("isChecking", "isUpdateAvailable", "checkError", "latestManifest", "isRollback"),
      UpdatesStateEventType.CheckCompleteUnavailable to listOf("isChecking", "isUpdateAvailable", "checkError", "latestManifest", "isRollback"),
      UpdatesStateEventType.CheckError to listOf("isChecking", "checkError"),
      UpdatesStateEventType.Download to listOf("isDownloading"),
      UpdatesStateEventType.DownloadComplete to listOf("isDownloading", "downloadError", "latestManifest", "downloadedManifest", "isUpdatePending", "isUpdateAvailable"),
      UpdatesStateEventType.DownloadError to listOf("isDownloading", "downloadError"),
      UpdatesStateEventType.Restart to listOf("isRestarting")
    )
  }
}

/**
The state machine context, with information that will be readable from JS.
 */
data class UpdatesStateContext(
  var isUpdateAvailable: Boolean = false,
  var isUpdatePending: Boolean = false,
  var isRollback: Boolean = false,
  var isChecking: Boolean = false,
  var isDownloading: Boolean = false,
  var isRestarting: Boolean = false,
  var latestManifest: Manifest? = null,
  var downloadedManifest: Manifest? = null,
  var checkError: Error? = null,
  var downloadError: Error? = null
) {

  val json: Bundle
    get() {
      return Bundle().apply {
        putBoolean("isUpdateAvailable", isUpdateAvailable)
        putBoolean("isUpdatePending", isUpdatePending)
        putBoolean("isRollback", isRollback)
        putBoolean("isChecking", isChecking)
        putBoolean("isDownloading", isDownloading)
        putBoolean("isRestarting", isRestarting)
        if (latestManifest != null) {
          putString("latestManifestString", latestManifest.toString())
        }
        if (downloadedManifest != null) {
          putString("downloadedManifestString", downloadedManifest.toString())
        }
        if (checkError != null) {
          putBundle(
            "checkError",
            Bundle().apply {
              putString("message", checkError?.message ?: "")
              putString("stack", checkError?.stackTraceToString() ?: "")
            }
          )
        }
        if (downloadError != null) {
          putBundle(
            "downloadError",
            Bundle().apply {
              putString("message", downloadError?.message ?: "")
              putString("stack", downloadError?.stackTraceToString() ?: "")
            }
          )
        }
      }
    }

  fun partialJsonWithKeys(keys: List<String>): Bundle {
    val fullBundle = json
    return Bundle().apply {
      for (key: String in keys) {
        if (json.containsKey(key)) {
          if (key.startsWith("is")) {
            putBoolean(key, fullBundle.getBoolean(key))
          } else if (key.endsWith("Manifest")) {
            putString(key, fullBundle.getString(key))
          } else {
            putBundle(key, fullBundle.getBundle(key))
          }
        }
      }
    }
  }

  companion object {
    val allProps: List<String> = listOf(
      "isUpdateAvailable",
      "isUpdatePending",
      "isRollback",
      "isChecking",
      "isDownloading",
      "isRestarting",
      "latestManifest",
      "downloadedManifest",
      "checkError",
      "downloadError"
    )
  }
}

class UpdatesStateMachine {
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
    // logger.info
    sendChangeEventToJS()
  }

  /**
   Called by AppLoaderTask delegate methods in AppController during the initial
   background check for updates, and called by checkForUpdateAsync(), fetchUpdateAsync(), and reloadAsync().
   */
  fun processEvent(event: UpdatesStateEvent) {
    if (transition(event)) {
      context = reducedContext(context, event)
      // logger.info
      // Send change event
      sendChangeEventToJS(event)
    }
  }

  /**
   Make sure the state transition is allowed, and then update the state.
   */
  private fun transition(event: UpdatesStateEvent): Boolean {
    val allowedEvents: List<UpdatesStateEventType> = updatesStateAllowedEvents[state] ?: listOf()
    assert(allowedEvents.contains(event.type))
    state = updatesStateTransitions[event.type] ?: UpdatesStateValue.Idle
    return true
  }

  private fun reducedContext(context: UpdatesStateContext, event: UpdatesStateEvent): UpdatesStateContext {
    val newContext = UpdatesStateContext(context.isUpdateAvailable, context.isUpdatePending, context.isRollback, context.isChecking, context.isDownloading, context.isRestarting, context.latestManifest, context.downloadedManifest, context.checkError, context.downloadError)
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

  private fun sendChangeEventToJS(event: UpdatesStateEvent? = null) {
    when (event) {
      null -> {
        changeEventSender?.sendUpdateStateChangeEventToBridge(
          UpdatesStateEventType.Restart,
          Bundle().apply {
            putStringArrayList("fields", ArrayList(UpdatesStateContext.allProps))
            putBundle("values", context.json)
          }
        )
      }
      else -> {
        changeEventSender?.sendUpdateStateChangeEventToBridge(
          event.type,
          Bundle().apply {
            putStringArrayList("fields", event.changedProperties)
            putBundle("values", context.partialJsonWithKeys(event.changedProperties))
          }
        )
      }
    }
  }
}
