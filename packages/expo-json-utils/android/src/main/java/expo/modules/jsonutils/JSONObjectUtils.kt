package expo.modules.jsonutils

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

@Throws(JSONException::class)
inline fun <reified T : Any> JSONObject.require(key: String): T {
  return when (T::class) {
    String::class -> this.getString(key) as T
    Double::class -> this.getDouble(key) as T
    Int::class -> this.getInt(key) as T
    Long::class -> this.getLong(key) as T
    Boolean::class -> this.getBoolean(key) as T
    JSONArray::class -> this.getJSONArray(key) as T
    JSONObject::class -> this.getJSONObject(key) as T
    else -> this.get(key) as T
  }
}

inline fun <reified T : Any> JSONObject.getNullable(key: String): T? {
  return if (!this.has(key)) {
    null
  } else {
    this.require(key)
  }
}
