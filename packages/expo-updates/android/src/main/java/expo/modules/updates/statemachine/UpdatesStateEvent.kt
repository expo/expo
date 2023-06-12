package expo.modules.updates.statemachine

import org.json.JSONObject

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
  val error: UpdatesStateError?
    get() {
      val message = body["message"] as? String?
      return if (message != null) {
        val error = UpdatesStateError(message)
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
     when that event is processed. This allows only changes in the state context to be sent
     to JS, instead of sending the entire context on each state change.
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