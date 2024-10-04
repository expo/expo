package expo.modules.kotlin.types

import android.net.Uri
import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.typedarray.RawTypedArrayHolder
import expo.modules.kotlin.types.folly.FollyDynamicExtensionConverter
import java.io.File
import java.net.URI
import java.net.URL
import kotlin.time.Duration
import kotlin.time.DurationUnit

object JSTypeConverter {
  interface ContainerProvider {
    fun createMap(): WritableMap
    fun createArray(): WritableArray
  }

  internal object DefaultContainerProvider : ContainerProvider {
    override fun createMap(): WritableMap = Arguments.createMap()
    override fun createArray(): WritableArray = Arguments.createArray()
  }

  /**
   * To support WritableArray and WritableMap, we must refrain from using types that are not supported by folly::dynamic.
   * Therefore, we need two separate methods for converting values to JSValue.
   * The legacy method is fully compatible with folly::dynamic, and in the new method,
   * we are beginning to transition to custom converters.
   */
  fun legacyConvertToJSValue(value: Any?, containerProvider: ContainerProvider = DefaultContainerProvider): Any? {
    return when (value) {
      null, is Unit -> null
      is Bundle -> value.toJSValue(containerProvider)
      is Array<*> -> value.toJSValue(containerProvider)
      is IntArray -> value.toJSValue(containerProvider)
      is FloatArray -> value.toJSValue(containerProvider)
      is DoubleArray -> value.toJSValue(containerProvider)
      is BooleanArray -> value.toJSValue(containerProvider)
      is ByteArray -> FollyDynamicExtensionConverter.put(value)
      is Map<*, *> -> value.toJSValue(containerProvider)
      is Enum<*> -> value.toJSValue()
      is Record -> value.toJSValue(containerProvider)
      is URI -> value.toJSValue()
      is URL -> value.toJSValue()
      is Uri -> value.toJSValue()
      is File -> value.toJSValue()
      is Pair<*, *> -> value.toJSValue(containerProvider)
      is Long -> value.toDouble()
      is Duration -> value.toDouble(DurationUnit.SECONDS)
      is RawTypedArrayHolder -> value.rawArray
      is Collection<*> -> value.toJSValue(containerProvider)
      else -> value
    }
  }

  fun convertToJSValue(
    value: Any?,
    containerProvider: ContainerProvider = DefaultContainerProvider,
    useExperimentalConverter: Boolean = false
  ): Any? {
    return when (value) {
      null, is Unit -> null
      is Bundle -> value.toJSValue(containerProvider)
      is Array<*> -> value.toJSValue(containerProvider)
      is IntArray, is FloatArray, is DoubleArray, is BooleanArray, is LongArray -> value
      is ByteArray -> FollyDynamicExtensionConverter.put(value)
      is Map<*, *> -> if (useExperimentalConverter) {
        value.toJSValueExperimental()
      } else {
        value.toJSValue(containerProvider)
      }
      is Enum<*> -> value.toJSValue()
      is Record -> value.toJSValue(containerProvider)
      is URI -> value.toJSValue()
      is URL -> value.toJSValue()
      is Uri -> value.toJSValue()
      is File -> value.toJSValue()
      is Pair<*, *> -> value.toJSValue(containerProvider)
      is Long -> value.toDouble()
      is Duration -> value.toDouble(DurationUnit.SECONDS)
      is RawTypedArrayHolder -> value.rawArray
      is Collection<*> -> if (useExperimentalConverter) {
        value.toJSValueExperimental()
      } else {
        value.toJSValue(containerProvider)
      }
      else -> value
    }
  }
}
