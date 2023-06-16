package expo.modules.updates.statemachine

import org.json.JSONObject

/**
The state machine context, with information intended to be consumed by application JS code.
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
  var checkError: UpdatesStateError? = null,
  var downloadError: UpdatesStateError? = null
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
        map["checkError"] = checkError!!.json
      }
      if (downloadError != null) {
        map["downloadError"] = downloadError!!.json
      }
      return map
    }
}
