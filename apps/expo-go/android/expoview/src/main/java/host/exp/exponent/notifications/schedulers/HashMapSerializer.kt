package host.exp.exponent.notifications.schedulers

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.HashMap

object HashMapSerializer {
  fun serialize(map: Map<String, Any>): String {
    val serialized = JSONObject(map)
    return serialized.toString()
  }

  @Throws(JSONException::class)
  fun deserialize(serializedMap: String?): HashMap<String, Any>? {
    if (serializedMap == null) {
      return null
    }

    val serialized: JSONObject? = try {
      JSONObject(serializedMap)
    } catch (e: JSONException) {
      e.printStackTrace()
      null
    }
    return jsonToMap(serialized)
  }

  @Throws(JSONException::class)
  fun jsonToMap(json: JSONObject?): HashMap<String, Any> {
    return if (json !== null && json !== JSONObject.NULL) {
      toMap(json)
    } else {
      hashMapOf()
    }
  }

  @Throws(JSONException::class)
  fun toMap(obj: JSONObject): HashMap<String, Any> {
    val map = hashMapOf<String, Any>()
    val keysItr = obj.keys()
    while (keysItr.hasNext()) {
      val key = keysItr.next()
      var value = obj[key]
      if (value is JSONArray) {
        value = toList(value)
      } else if (value is JSONObject) {
        value = toMap(value)
      }
      map[key] = value
    }
    return map
  }

  @Throws(JSONException::class)
  fun toList(array: JSONArray): List<Any> {
    val list = mutableListOf<Any>()
    for (i in 0 until array.length()) {
      var value = array[i]
      if (value is JSONArray) {
        value = toList(value)
      } else if (value is JSONObject) {
        value = toMap(value)
      }
      list.add(value)
    }
    return list
  }
}
