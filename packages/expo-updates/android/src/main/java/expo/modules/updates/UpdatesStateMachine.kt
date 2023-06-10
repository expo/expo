package expo.modules.updates

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import expo.modules.updates.logging.UpdatesLogger
import org.json.JSONObject

/**
Protocol with a method for sending state change events to JS.
In production, this will be implemented by the AppController.sharedInstance.
 */
interface UpdatesStateChangeEventSender {
  // Method to send events
  fun sendUpdateStateChangeEventToBridge(eventType: UpdatesStateEventType, fields: List<String>, values: Map<String, Any>)
}

class UpdatesStateError : Error() {
  override var message: String? = null
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
  val manifest: JSONObject?
    get() {
      return body["manifest"] as? JSONObject
    }
  val error: Error?
    get() {
      val message = body["message"] as? String?
      return if (message != null) {
        val error = UpdatesStateError()
        error.message = message
        error
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
  var latestManifest: JSONObject? = null,
  var downloadedManifest: JSONObject? = null,
  var checkError: Error? = null,
  var downloadError: Error? = null
) {

  val json: MutableMap<String, Any>
    get() {
      val map: MutableMap<String, Any> = mutableMapOf(
        "isUpdateAvailable" to isUpdateAvailable,
        "isUpdatePending" to isUpdatePending,
        "isRollback" to isRollback,
        "isChecking" to isChecking,
        "isDownloading" to isDownloading,
        "isRestarting" to isRestarting
      )
      if (latestManifest != null) {
        map["latestManifest"] = latestManifest!!
      }
      if (downloadedManifest != null) {
        map["downloadedManifest"] = downloadedManifest!!
      }
      if (checkError != null) {
        map["checkError"] = mutableMapOf(
          "message" to (checkError?.message ?: ""),
          "stack" to (checkError?.stackTraceToString() ?: "")
        )
      }
      if (downloadError != null) {
        map["downloadError"] = mutableMapOf(
          "message" to (downloadError?.message ?: ""),
          "stack" to (downloadError?.stackTraceToString() ?: "")
        )
      }
      return map
    }

  fun partialJsonWithKeys(keys: List<String>): MutableMap<String, Any> {
    val fullJson = json
    val map: MutableMap<String, Any> = mutableMapOf()
    for (key: String in keys) {
      if (fullJson.containsKey(key)) {
        map[key] = fullJson[key] as Any
      }
    }
    return map
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

class UpdatesStateMachine constructor(
  androidContext: Context? = null
) {

  private val logger = when (androidContext) {
    null -> null
    else -> UpdatesLogger(androidContext)
  }

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
   Called by AppLoaderTask delegate methods in AppController during the initial
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
    val fields = when (event) {
      null -> UpdatesStateContext.allProps
      else -> event.changedProperties
    }
    val values = when (event) {
      null -> context.json
      else -> context.partialJsonWithKeys(event.changedProperties)
    }
    changeEventSender?.sendUpdateStateChangeEventToBridge(
      event?.type ?: UpdatesStateEventType.Restart,
      fields,
      values
    )
  }

  companion object {
    fun paramsForJSEvent(fields: List<String>, values: Map<String, Any>): WritableMap {
      val fieldArray = Arguments.createArray()
      for (field: String in fields) {
        fieldArray.pushString(field)
      }
      val valueMap = Arguments.createMap()
      for (field: String in fields) {
        if (field.startsWith("is")) {
          valueMap.putBoolean(field, values[field] as Boolean)
        } else if (field.endsWith("Manifest")) {
          if (values[field] != null) {
            valueMap.putString("${field}String", (values[field] as JSONObject).toString())
          } else {
            valueMap.putNull(field)
          }
        } else { // errors
          if (values[field] != null) {
            val errorMap = Arguments.createMap()
            errorMap.putString("message", (values[field] as Map<*, *>)["message"] as String)
            errorMap.putString("stack", (values[field] as Map<*, *>)["stack"] as String)
            valueMap.putMap(field, errorMap)
          } else {
            valueMap.putNull(field)
          }
        }
      }
      val params = Arguments.createMap()
      params.putArray("fields", fieldArray)
      params.putMap("values", valueMap)
      return params
    }
  }
}
