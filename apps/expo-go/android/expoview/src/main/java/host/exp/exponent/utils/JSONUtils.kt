// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.ArrayList
import java.util.HashMap

object JSONUtils {
  @Throws(JSONException::class)
  @JvmStatic
  fun getJSONString(item: Any): String {
    if (item is HashMap<*, *>) {
      return getJSONFromHashMap(item).toString()
    } else if (item is ArrayList<*>) {
      return getJSONFromArrayList(item).toString()
    }
    return item.toString()
  }

  @Throws(JSONException::class)
  private fun getJSONFromArrayList(array: ArrayList<*>): JSONArray {
    val json = JSONArray()
    for (value in array) {
      var newValue = value
      if (value is HashMap<*, *>) {
        newValue = getJSONFromHashMap(value)
      } else if (value is ArrayList<*>) {
        newValue = getJSONFromArrayList(value)
      }
      json.put(newValue)
    }
    return json
  }

  @Throws(JSONException::class)
  private fun getJSONFromHashMap(map: HashMap<*, *>): JSONObject {
    val json = JSONObject()
    for (key in map.keys) {
      var value = map[key]
      if (value is HashMap<*, *>) {
        value = getJSONFromHashMap(value)
      } else if (value is ArrayList<*>) {
        value = getJSONFromArrayList(value)
      }
      json.put(key.toString(), value)
    }
    return json
  }
}
