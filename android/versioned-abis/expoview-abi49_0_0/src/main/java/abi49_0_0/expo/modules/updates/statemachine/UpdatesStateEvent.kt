package abi49_0_0.expo.modules.updates.statemachine

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
      return UpdatesStateEvent(UpdatesStateEventType.Check)
    }
    fun Download(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.Download)
    }
    fun CheckError(message: String): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckError, errorMessage = message)
    }
    fun DownloadError(message: String): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadError, errorMessage = message)
    }
    fun CheckComplete(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckCompleteUnavailable)
    }
    fun CheckCompleteWithUpdate(manifest: JSONObject?): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable, manifest = manifest)
    }
    fun CheckCompleteWithRollback(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable, isRollback = true)
    }
    fun DownloadComplete(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadComplete)
    }
    fun DownloadCompleteWithUpdate(manifest: JSONObject?): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadComplete, manifest = manifest)
    }
    fun DownloadCompleteWithRollback(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.DownloadComplete, isRollback = true)
    }
    fun Restart(): UpdatesStateEvent {
      return UpdatesStateEvent(UpdatesStateEventType.Restart)
    }
  }
}
