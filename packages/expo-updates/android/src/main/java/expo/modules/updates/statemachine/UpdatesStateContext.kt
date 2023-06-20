package expo.modules.updates.statemachine

import org.json.JSONObject

/**
The state machine context, with information intended to be consumed by application JS code.
 */
data class UpdatesStateContext(
  val isUpdateAvailable: Boolean = false,
  val isUpdatePending: Boolean = false,
  val isRollback: Boolean = false,
  val isChecking: Boolean = false,
  val isDownloading: Boolean = false,
  val isRestarting: Boolean = false,
  val latestManifest: JSONObject? = null,
  val downloadedManifest: JSONObject? = null,
  val checkError: UpdatesStateError? = null,
  val downloadError: UpdatesStateError? = null
) {

  val json: Map<String, Any>
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
        map["latestManifest"] = latestManifest
      }
      if (downloadedManifest != null) {
        map["downloadedManifest"] = downloadedManifest
      }
      if (checkError != null) {
        map["checkError"] = checkError.json
      }
      if (downloadError != null) {
        map["downloadError"] = downloadError.json
      }
      return map
    }
}
