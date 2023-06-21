package expo.modules.updates.statemachine

import org.json.JSONObject

/**
Structure representing an event that can be sent to the machine.
 */
data class UpdatesStateEvent(
  val type: UpdatesStateEventType,
  val manifest: JSONObject? = null,
  private val errorMessage: String? = null,
  val isRollback: Boolean = false
) {
  val error: UpdatesStateError?
    get() {
      return errorMessage?.let { UpdatesStateError(it) }
    }

  companion object {
    fun Check(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.Check, null, null, false)
    }
    fun Download(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.Download, null, null, false)
    }
    fun CheckError(message: String): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckError, null, message, false)
    }
    fun DownloadError(message: String): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadError, null, message, false)
    }
    fun CheckComplete(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckCompleteUnavailable, null, null, false)
    }
    fun CheckCompleteWithUpdate(manifest: JSONObject?): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable, manifest, null, false)
    }
    fun CheckCompleteWithRollback(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable, null, null, true)
    }
    fun DownloadComplete(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadComplete, null, null, false)
    }
    fun DownloadCompleteWithUpdate(manifest: JSONObject?): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadComplete, manifest, null, false)
    }
    fun DownloadCompleteWithRollback(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadComplete, null, null, true)
    }
  }
}
