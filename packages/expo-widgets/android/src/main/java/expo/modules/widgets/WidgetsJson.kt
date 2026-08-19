package expo.modules.widgets

import org.json.JSONArray
import org.json.JSONObject

internal object WidgetsJson {
  fun stringifyMap(value: Map<String, Any?>): String {
    return JSONObject(wrapMap(value)).toString()
  }

  fun stringifyList(value: List<Any?>): String {
    return JSONArray(value.map(::wrap)).toString()
  }

  fun parseMap(value: String): Map<String, Any?> {
    return JSONObject(value).toMap()
  }

  fun parseList(value: String): List<Any?> {
    return JSONArray(value).toList()
  }

  private fun wrapMap(value: Map<String, Any?>): Map<String, Any?> {
    return value.mapValues { wrap(it.value) }
  }

  private fun wrap(value: Any?): Any {
    return when (value) {
      null -> JSONObject.NULL
      is Map<*, *> -> JSONObject(
        value.entries.associate { (key, entryValue) ->
          key.toString() to wrap(entryValue)
        }
      )
      is List<*> -> JSONArray(value.map(::wrap))
      is Array<*> -> JSONArray(value.map(::wrap))
      else -> value
    }
  }

  private fun JSONObject.toMap(): Map<String, Any?> {
    return keys().asSequence().associateWith { key ->
      unwrap(get(key))
    }
  }

  private fun JSONArray.toList(): List<Any?> {
    return List(length()) { index ->
      unwrap(get(index))
    }
  }

  private fun unwrap(value: Any?): Any? {
    return when (value) {
      null,
      JSONObject.NULL -> null
      is JSONObject -> value.toMap()
      is JSONArray -> value.toList()
      else -> value
    }
  }
}
