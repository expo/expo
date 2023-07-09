package expo.modules.updates.statemachine

import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
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

  /**
   * Creates a WritableMap to be sent to JS on a state change.
   */
  val writableMap: WritableMap
    get() {
      val contextMap = Arguments.createMap()
      contextMap.putBoolean("isUpdateAvailable", isUpdateAvailable)
      contextMap.putBoolean("isUpdatePending", isUpdatePending)
      contextMap.putBoolean("isRollback", isRollback)
      contextMap.putBoolean("isChecking", isChecking)
      contextMap.putBoolean("isDownloading", isDownloading)
      contextMap.putBoolean("isRestarting", isRestarting)
      if (latestManifest != null) {
        contextMap.putString("latestManifestString", latestManifest.toString())
      }
      if (downloadedManifest != null) {
        contextMap.putString("downloadedManifestString", downloadedManifest.toString())
      }
      if (checkError != null) {
        val errorMap = Arguments.createMap()
        errorMap.putString("message", checkError.message)
        contextMap.putMap("checkError", errorMap)
      }
      if (downloadError != null) {
        val errorMap = Arguments.createMap()
        errorMap.putString("message", downloadError.message)
        contextMap.putMap("downloadError", errorMap)
      }
      val result = Arguments.createMap()
      result.putMap("context", contextMap)
      return result
    }

  /**
   * Creates a Bundle to be returned to JS on a call to nativeStateMachineContext()
   */
  val bundle: Bundle
    get() {
      return Bundle().apply {
        this.putBoolean("isUpdateAvailable", isUpdateAvailable)
        this.putBoolean("isUpdatePending", isUpdatePending)
        this.putBoolean("isRollback", isRollback)
        this.putBoolean("isChecking", isChecking)
        this.putBoolean("isDownloading", isDownloading)
        this.putBoolean("isRestarting", isRestarting)
        if (latestManifest != null) {
          this.putString("latestManifestString", latestManifest.toString())
        }
        if (downloadedManifest != null) {
          this.putString("downloadedManifestString", downloadedManifest.toString())
        }
        if (checkError != null) {
          val errorMap = Bundle().apply {
            this.putString("message", checkError.message)
          }
          this.putBundle("checkError", errorMap)
        }
        if (downloadError != null) {
          val errorMap = Bundle().apply {
            this.putString("message", downloadError.message)
          }
          this.putBundle("downloadError", errorMap)
        }
      }
    }
}
