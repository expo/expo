package expo.modules.updates.statemachine

import org.json.JSONObject
import java.util.Date

/**
Structure representing an event that can be sent to the machine.
 */
sealed class UpdatesStateEvent(val type: UpdatesStateEventType) {
  class StartStartup : UpdatesStateEvent(UpdatesStateEventType.StartStartup)
  class EndStartup : UpdatesStateEvent(UpdatesStateEventType.EndStartup)
  class Check : UpdatesStateEvent(UpdatesStateEventType.Check)
  class CheckCompleteWithUpdate(val manifest: JSONObject) : UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable)
  class CheckCompleteWithRollback(val commitTime: Date) : UpdatesStateEvent(UpdatesStateEventType.CheckCompleteAvailable)
  class CheckCompleteUnavailable : UpdatesStateEvent(UpdatesStateEventType.CheckCompleteUnavailable)
  class CheckError(private val errorMessage: String) : UpdatesStateEvent(UpdatesStateEventType.CheckError) {
    val error: UpdatesStateError
      get() {
        return UpdatesStateError(errorMessage)
      }
  }
  class Download : UpdatesStateEvent(UpdatesStateEventType.Download)
  class DownloadProgress(val progress: Double) : UpdatesStateEvent(UpdatesStateEventType.DownloadProgress)
  class DownloadComplete : UpdatesStateEvent(UpdatesStateEventType.DownloadComplete)
  class DownloadCompleteWithUpdate(val manifest: JSONObject) : UpdatesStateEvent(UpdatesStateEventType.DownloadComplete)
  class DownloadCompleteWithRollback : UpdatesStateEvent(UpdatesStateEventType.DownloadComplete)
  class DownloadError(private val errorMessage: String) : UpdatesStateEvent(UpdatesStateEventType.DownloadError) {
    val error: UpdatesStateError
      get() {
        return UpdatesStateError(errorMessage)
      }
  }
  class Restart : UpdatesStateEvent(UpdatesStateEventType.Restart)
}
