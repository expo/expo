package expo.modules.notifications

import android.os.Bundle
import android.os.Handler
import android.os.ResultReceiver
import expo.modules.kotlin.types.JSTypeConverter
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

typealias ResultReceiverBody = (resultCode: Int, resultData: Bundle?) -> Unit

internal fun createDefaultResultReceiver(
  handler: Handler?,
  body: ResultReceiverBody
): ResultReceiver {
  return object : ResultReceiver(handler) {
    override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
      super.onReceiveResult(resultCode, resultData)
      body(resultCode, resultData)
    }
  }
}

/**
 * Given an input bundle, creates a new bundle with non-convertible objects removed
 */
internal fun filteredBundleForJSTypeConverter(bundle: Bundle): Bundle {
  val result = Bundle()
  result.putAll(bundle)
  bundle.keySet().forEach { key: String ->
    val value = bundle[key]
    when (value is Bundle) {
      true -> result.putBundle(key, filteredBundleForJSTypeConverter(value))
      else -> {
        if (!JSTypeConverter.valueIsConvertibleToJSValue(value)) {
          result.remove(key)
        }
      }
    }
  }
  return result
}

/**
 * Returns true if the argument is a valid JSON string, false otherwise
 */
internal fun isValidJSONString(test: Any?): Boolean {
  when (test is String) {
    true -> {
      try {
        JSONObject(test as String)
        return true
      } catch (objectEx: JSONException) {
        try {
          JSONArray(test as String)
          return true
        } catch (arrayEx: JSONException) {
          return false
        }
      }
    }
    else -> {
      return false
    }
  }
}
