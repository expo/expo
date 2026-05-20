package expo.modules.updates.statemachine

import android.os.Bundle
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
The state machine context, with information intended to be consumed by application JS code.
 */
class UpdatesStateContext private constructor(
  val isStartupProcedureRunning: Boolean = false,
  val isUpdateAvailable: Boolean = false,
  val isUpdatePending: Boolean = false,
  val isChecking: Boolean = false,
  val isDownloading: Boolean = false,
  val isRestarting: Boolean = false,
  val restartCount: Int = 0,
  val latestManifest: JSONObject? = null,
  val downloadedManifest: JSONObject? = null,
  val rollback: UpdatesStateContextRollback? = null,
  val checkError: UpdatesStateError? = null,
  val downloadError: UpdatesStateError? = null,
  val downloadProgress: Double = 0.0,
  val lastCheckForUpdateTime: Date? = null,
  val sequenceNumber: Int,
  val downloadStartTime: Date? = null,
  val downloadFinishTime: Date? = null
) {
  constructor(
    isStartupProcedureRunning: Boolean = false,
    isUpdateAvailable: Boolean = false,
    isUpdatePending: Boolean = false,
    isChecking: Boolean = false,
    isDownloading: Boolean = false,
    isRestarting: Boolean = false,
    restartCount: Int = 0,
    latestManifest: JSONObject? = null,
    downloadedManifest: JSONObject? = null,
    rollback: UpdatesStateContextRollback? = null,
    checkError: UpdatesStateError? = null,
    downloadError: UpdatesStateError? = null,
    downloadProgress: Double = 0.0,
    lastCheckForUpdateTime: Date? = null,
    downloadStartTime: Date? = null,
    downloadFinishTime: Date? = null
  ) : this(
    isStartupProcedureRunning = isStartupProcedureRunning,
    isUpdateAvailable = isUpdateAvailable,
    isUpdatePending = isUpdatePending,
    isChecking = isChecking,
    isDownloading = isDownloading,
    isRestarting = isRestarting,
    restartCount = restartCount,
    latestManifest = latestManifest,
    downloadedManifest = downloadedManifest,
    rollback = rollback,
    checkError = checkError,
    downloadError = downloadError,
    downloadProgress = downloadProgress,
    lastCheckForUpdateTime = lastCheckForUpdateTime,
    sequenceNumber = 0,
    downloadStartTime = downloadStartTime,
    downloadFinishTime = downloadFinishTime
  )

  fun copyAndIncrementSequenceNumber(
    isStartupProcedureRunning: Boolean = this.isStartupProcedureRunning,
    isUpdateAvailable: Boolean = this.isUpdateAvailable,
    isUpdatePending: Boolean = this.isUpdatePending,
    isChecking: Boolean = this.isChecking,
    isDownloading: Boolean = this.isDownloading,
    downloadProgress: Double = this.downloadProgress,
    isRestarting: Boolean = this.isRestarting,
    restartCount: Int = this.restartCount,
    latestManifest: JSONObject? = this.latestManifest,
    downloadedManifest: JSONObject? = this.downloadedManifest,
    rollback: UpdatesStateContextRollback? = this.rollback,
    checkError: UpdatesStateError? = this.checkError,
    downloadError: UpdatesStateError? = this.downloadError,
    lastCheckForUpdateTime: Date? = this.lastCheckForUpdateTime,
    downloadStartTime: Date? = this.downloadStartTime,
    downloadFinishTime: Date? = this.downloadFinishTime
  ): UpdatesStateContext = UpdatesStateContext(
    isStartupProcedureRunning = isStartupProcedureRunning,
    isUpdateAvailable = isUpdateAvailable,
    isUpdatePending = isUpdatePending,
    isChecking = isChecking,
    isDownloading = isDownloading,
    isRestarting = isRestarting,
    restartCount = restartCount,
    latestManifest = latestManifest,
    downloadedManifest = downloadedManifest,
    rollback = rollback,
    checkError = checkError,
    downloadError = downloadError,
    downloadProgress = downloadProgress,
    lastCheckForUpdateTime = lastCheckForUpdateTime,
    sequenceNumber = this.sequenceNumber + 1,
    downloadStartTime = downloadStartTime,
    downloadFinishTime = downloadFinishTime
  )

  fun resetCopyWithIncrementedRestartCountAndSequenceNumber(): UpdatesStateContext = UpdatesStateContext(
    restartCount = this.restartCount + 1,
    sequenceNumber = this.sequenceNumber + 1
  )

  val nativeInterfaceContext: expo.modules.updatesinterface.UpdatesNativeInterfaceStateContext
    get() = expo.modules.updatesinterface.UpdatesNativeInterfaceStateContext(
      isUpdateAvailable = isUpdateAvailable,
      isUpdatePending = isUpdatePending,
      isChecking = isChecking,
      isDownloading = isDownloading,
      isRestarting = isRestarting,
      restartCount = restartCount,
      latestManifest = latestManifest?.let { jsonToMap(it) },
      downloadedManifest = downloadedManifest?.let { jsonToMap(it) },
      rollback = rollback?.let {
        expo.modules.updatesinterface.UpdatesNativeInterfaceStateContext.Rollback(commitTime = it.commitTime)
      },
      checkError = checkError?.let { mapOf("message" to it.message) },
      downloadError = downloadError?.let { mapOf("message" to it.message) },
      downloadProgress = downloadProgress,
      lastCheckForUpdateTime = lastCheckForUpdateTime,
      sequenceNumber = sequenceNumber,
      downloadStartTime = downloadStartTime,
      downloadFinishTime = downloadFinishTime
    )

  val json: Map<String, Any>
    get() {
      val map: MutableMap<String, Any> = mutableMapOf(
        "isStartupProcedureRunning" to isStartupProcedureRunning,
        "isUpdateAvailable" to isUpdateAvailable,
        "isUpdatePending" to isUpdatePending,
        "isChecking" to isChecking,
        "isDownloading" to isDownloading,
        "isRestarting" to isRestarting,
        "restartCount" to restartCount,
        "downloadProgress" to downloadProgress,
        "sequenceNumber" to sequenceNumber
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
      if (downloadStartTime != null) {
        map["downloadStartTime"] = downloadStartTime.time
      }
      if (downloadFinishTime != null) {
        map["downloadFinishTime"] = downloadFinishTime.time
      }
      return map
    }

  /**
   * Creates a Bundle to be synchronized with JS state
   */
  val bundle: Bundle
    get() {
      return Bundle().apply {
        putBoolean("isStartupProcedureRunning", isStartupProcedureRunning)
        putBoolean("isUpdateAvailable", isUpdateAvailable)
        putBoolean("isUpdatePending", isUpdatePending)
        putBoolean("isChecking", isChecking)
        putBoolean("isDownloading", isDownloading)
        putBoolean("isRestarting", isRestarting)
        putInt("restartCount", restartCount)
        putInt("sequenceNumber", sequenceNumber)
        putDouble("downloadProgress", downloadProgress)
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

    private fun jsonToMap(json: JSONObject): Map<String, Any> {
      val map = mutableMapOf<String, Any>()
      val keys = json.keys()
      while (keys.hasNext()) {
        val key = keys.next()
        map[key] = json.get(key)
      }
      return map
    }
  }
}
