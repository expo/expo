package expo.modules.updates.statemachine

import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
The state machine context, with information intended to be consumed by application JS code.
 */
data class UpdatesStateContext(
  val isUpdateAvailable: Boolean = false,
  val isUpdatePending: Boolean = false,
  val isChecking: Boolean = false,
  val isDownloading: Boolean = false,
  val isRestarting: Boolean = false,
  val latestManifest: JSONObject? = null,
  val downloadedManifest: JSONObject? = null,
  val rollback: UpdatesStateContextRollback? = null,
  val checkError: UpdatesStateError? = null,
  val downloadError: UpdatesStateError? = null,
  val lastCheckForUpdateTime: Date? = null
) {

  val json: Map<String, Any>
    get() {
      val map: MutableMap<String, Any> = mutableMapOf(
        "isUpdateAvailable" to isUpdateAvailable,
        "isUpdatePending" to isUpdatePending,
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
      if (rollback != null) {
        map["rollback"] = rollback.json
      }
      if (checkError != null) {
        map["checkError"] = checkError.json
      }
      if (downloadError != null) {
        map["downloadError"] = downloadError.json
      }
      if (lastCheckForUpdateTime != null) {
        map["lastCheckForUpdateTime"] = lastCheckForUpdateTime
      }
      return map
    }

  /**
   * Creates a WritableMap to be sent to JS on a state change.
   */
  val writableMap: WritableMap
    get() {
      val result = Arguments.createMap()
      result.putMap("context", Arguments.fromBundle(bundle))
      return result
    }

  /**
   * Creates a Bundle to be returned to JS on a call to nativeStateMachineContext()
   */
  val bundle: Bundle
    get() {
      return Bundle().apply {
        putBoolean("isUpdateAvailable", isUpdateAvailable)
        putBoolean("isUpdatePending", isUpdatePending)
        putBoolean("isChecking", isChecking)
        putBoolean("isDownloading", isDownloading)
        putBoolean("isRestarting", isRestarting)
        if (latestManifest != null) {
          putString("latestManifestString", latestManifest.toString())
        }
        if (downloadedManifest != null) {
          putString("downloadedManifestString", downloadedManifest.toString())
        }
        if (rollback != null) {
          putBundle(
            "rollback",
            Bundle().apply {
              putString("commitTime", rollback.commitTimeString)
            }
          )
        }
        if (checkError != null) {
          val errorMap = Bundle().apply {
            putString("message", checkError.message)
          }
          this.putBundle("checkError", errorMap)
        }
        if (downloadError != null) {
          val errorMap = Bundle().apply {
            putString("message", downloadError.message)
          }
          putBundle("downloadError", errorMap)
        }
        if (lastCheckForUpdateTime != null) {
          putString("lastCheckForUpdateTimeString", DATE_FORMATTER.format(lastCheckForUpdateTime))
        }
      }
    }

  companion object {
    val DATE_FORMATTER: SimpleDateFormat by lazy {
      SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = java.util.TimeZone.getTimeZone("GMT")
      }
    }
  }
}
