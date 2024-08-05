package expo.modules.notifications

import android.os.Bundle
import android.os.Handler
import android.os.ResultReceiver
import expo.modules.kotlin.types.JSTypeConverter
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

typealias ResultReceiverBody = (resultCode: Int, resultData: Bundle?) -> Unit
typealias BundleConversionTester = (bundle: Bundle) -> Boolean

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
  return filteredBundleForJSTypeConverter(bundle, isBundleConvertibleToJSValue)
}

internal fun filteredBundleForJSTypeConverter(bundle: Bundle, testBundle: BundleConversionTester): Bundle {
  return when (testBundle(bundle)) {
    true -> bundle
    else -> {
      // Store keys whose values are convertible
      val goodKeys: MutableSet<String> = mutableSetOf()
      // Do first pass to filter any values that are bundles
      bundle.keySet().forEach { key: String ->
        val value = bundle[key]
        if (value is Bundle) {
          bundle.putBundle(key, filteredBundleForJSTypeConverter(value, testBundle))
          goodKeys.add(key)
        }
      }
      // Second pass: create a bundle with just the value for that key, and see if it converts
      // There is no generic put() method for bundles, so we putAll() and then remove values
      // other than the one we are testing
      bundle.keySet().forEach { key: String ->
        if (!goodKeys.contains(key)) {
          val test = Bundle()
          test.putAll(bundle)
          bundle.keySet().forEach { otherKey: String ->
            if (!otherKey.equals(key)) {
              test.remove(otherKey)
            }
          }
          if (testBundle(test)) {
            goodKeys.add(key)
          }
        }
      }
      // Now create a new bundle, remove keys that are not good, and return
      val result = Bundle()
      result.putAll(bundle)
      bundle.keySet().forEach { key: String ->
        if (!goodKeys.contains(key)) {
          result.remove(key)
        }
      }
      result
    }
  }
}

internal val isBundleConvertibleToJSValue: BundleConversionTester = { bundle: Bundle ->
  try {
    JSTypeConverter.convertToJSValue(bundle)
    true
  } catch (e: Throwable) {
    false
  }
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
