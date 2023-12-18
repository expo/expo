package expo.modules.updates.logging

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

/**
 * Schema for the fields in expo-updates log message JSON strings
 */
data class UpdatesLogEntry(
  val timestamp: Long,
  val message: String,
  val code: String,
  val level: String,
  val updateId: String?,
  val assetId: String?,
  val stacktrace: List<String>?
) {
  fun asString(): String {
    return JSONObject(
      mapOf(
        "timestamp" to timestamp,
        "message" to message,
        "code" to code,
        "level" to level
      )
    ).apply {
      if (updateId != null) {
        put("updateId", updateId)
      }
      if (assetId != null) {
        put("assetId", assetId)
      }
      if (stacktrace != null && stacktrace.isNotEmpty()) {
        put("stacktrace", JSONArray(stacktrace))
      }
    }.toString()
  }

  companion object {
    fun create(json: String): UpdatesLogEntry? {
      return try {
        val jsonObject = JSONObject(json)
        UpdatesLogEntry(
          jsonObject.require("timestamp"),
          jsonObject.require("message"),
          jsonObject.require("code"),
          jsonObject.require("level"),
          jsonObject.getNullable("updateId"),
          jsonObject.getNullable("assetId"),
          jsonObject.getNullable<JSONArray>("stacktrace")?.let { jsonArray ->
            List(jsonArray.length()) { i -> jsonArray.getString(i) }
          }
        )
      } catch (e: JSONException) {
        null
      }
    }
  }
}
