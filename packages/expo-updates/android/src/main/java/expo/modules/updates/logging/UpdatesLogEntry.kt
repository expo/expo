// Copyright 2022-present 650 Industries. All rights reserved.

// Schema for the fields in expo-updates log message JSON strings

package expo.modules.updates.logging

import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener

data class UpdatesLogEntry(
  val timestamp: Long,
  val message: String,
  val code: String,
  val level: String,
  val updateId: String?,
  val assetId: String?,
  val stacktrace: List<String>?,
) {
  fun asString(): String {
    val o = JSONObject()
    o.put("timestamp", timestamp)
    o.put("message", message)
    o.put("code", code)
    o.put("level", level)
    if (updateId != null) {
      o.put("updateId", updateId)
    }
    if (assetId != null) {
      o.put("assetId", assetId)
    }
    if (stacktrace != null && stacktrace.isNotEmpty()) {
      val a = JSONArray(stacktrace)
      o.put("stacktrace", a)
    }
    return o.toString()
  }

  companion object {
    fun create(json: String): UpdatesLogEntry {
      val jsonObject = JSONTokener(json).nextValue() as JSONObject
      val timestamp = jsonObject.getLong("timestamp")
      val message = jsonObject.getString("message")
      val code = jsonObject.getString("code")
      val level = jsonObject.getString("level")
      val updateId = jsonObject.optString("updateId", null)
      val assetId = jsonObject.optString("assetId", null)
      val jsonArray = jsonObject.optJSONArray("stacktrace")

      var stacktrace: List<String>? = null

      if (jsonArray != null) {
        stacktrace = mutableListOf()
        for (i in 0 until jsonArray.length()) {
          stacktrace.add(jsonArray.getString(i))
        }
      }

      return UpdatesLogEntry(timestamp, message, code, level, updateId, assetId, stacktrace)
    }
  }
}
