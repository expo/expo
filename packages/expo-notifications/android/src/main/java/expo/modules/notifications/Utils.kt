package expo.modules.notifications

import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.ResultReceiver
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.typedarray.RawTypedArrayHolder
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.net.URI
import java.net.URL

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
 * Returns true if object is convertible to a WritableMap element
 */
internal fun isWritableMapConvertible(value: Any?): Boolean {
  return when (value) {
    null, is Unit -> true
    is Bundle -> true
    is Array<*> -> true
    is IntArray -> true
    is FloatArray -> true
    is DoubleArray -> true
    is BooleanArray -> true
    is ByteArray -> true
    is Map<*, *> -> true
    is Enum<*> -> true
    is Record -> true
    is URI -> true
    is URL -> true
    is Uri -> true
    is File -> true
    is Pair<*, *> -> true
    is Long -> true
    is Int -> true
    is String -> true
    is Float -> true
    is Double -> true
    is Boolean -> true
    is RawTypedArrayHolder -> true
    is Iterable<*> -> true
    else -> false
  }
}

/**
 * Given an input bundle, creates a new bundle with non-WritableMap-convertible objects removed
 */
fun filteredBundleForWritableMap(bundle: Bundle): Bundle? {
  val result = Bundle()
  result.putAll(bundle)
  bundle.keySet().forEach { key: String ->
    val value = bundle[key]
    if (!isWritableMapConvertible(value)) {
      result.remove(key)
    } else if (value is Bundle) {
      result.putBundle(key, filteredBundleForWritableMap(value))
    }
  }
  return result
}

/**
 * Returns true if the argument is a valid JSON string, false otherwise
 */
fun isValidJSONString(test: Any?): Boolean {
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
