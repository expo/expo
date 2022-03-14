package expo.modules.kotlin.types

import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.records.Record

object JSTypeConverter {
  interface ContainerProvider {
    fun createMap(): WritableMap
    fun createArray(): WritableArray
  }

  internal object DefaultContainerProvider : ContainerProvider {
    override fun createMap(): WritableMap = Arguments.createMap()
    override fun createArray(): WritableArray = Arguments.createArray()
  }

  fun convertToJSValue(value: Any?, containerProvider: ContainerProvider = DefaultContainerProvider): Any? {
    return when (value) {
      null, is Unit -> null
      is Bundle -> value.toJSValue(containerProvider)
      is Iterable<*> -> value.toJSValue(containerProvider)
      is Array<*> -> value.toJSValue(containerProvider)
      is IntArray -> value.toJSValue(containerProvider)
      is FloatArray -> value.toJSValue(containerProvider)
      is DoubleArray -> value.toJSValue(containerProvider)
      is Map<*, *> -> value.toJSValue(containerProvider)
      is Enum<*> -> value.toJSValue()
      is Record -> value.toJSValue(containerProvider)
      else -> value
    }
  }
}
