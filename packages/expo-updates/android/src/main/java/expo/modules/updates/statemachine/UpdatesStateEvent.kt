package expo.modules.updates.statemachine

import org.json.JSONObject

/**
Structure representing an event that can be sent to the machine.
 */
sealed class UpdatesStateEvent(val type: UpdatesStateEventType) {
  class Check : UpdatesStateEvent(UpdatesStateEventType.Check)
  class Download : UpdatesStateEvent(UpdatesStateEventType.Download)
  class CheckError(private val errorMessage: String) : UpdatesStateEvent(UpdatesStateEventType.CheckError) {
    val error: UpdatesStateError
      get() {
        return UpdatesStateError(errorMessage)
      }
  }
  class DownloadError(private val errorMessage: String) : UpdatesStateEvent(UpdatesStateEventType.DownloadError) {
    val error: UpdatesStateError
      get() {
        return UpdatesStateError(errorMessage)
      }
  }
  class CheckCompleteUnavailable : UpdatesStateEvent(UpdatesStateEventType.CheckCompleteUnavailable)
  class CheckCompleteWithUpdate(val manifest: JSONObject) : UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable)
  class CheckCompleteWithRollback : UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable)
  class DownloadComplete : UpdatesStateEvent(UpdatesStateEventType.DownloadComplete)
  class DownloadCompleteWithUpdate(val manifest: JSONObject) : UpdatesStateEvent(UpdatesStateEventType.DownloadComplete)
  class DownloadCompleteWithRollback : UpdatesStateEvent(UpdatesStateEventType.DownloadComplete)
  class Restart : UpdatesStateEvent(UpdatesStateEventType.Restart)
}
