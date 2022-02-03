package expo.modules.kotlin.records

import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import java.lang.IllegalArgumentException
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.isAccessible

interface Record

fun Record.toJSMap(): ReadableMap {
  val writableMap = Arguments.createMap()
  javaClass
    .kotlin
    .memberProperties.map { property ->
      val fieldInformation = property.findAnnotation<Field>() ?: return@map
      val jsKey = fieldInformation.key.takeUnless { it == "" } ?: property.name

      property.isAccessible = true

      // TODO(@lukmccall): add more sophisticated conversion method
      when (val value = property.get(this)) {
        null, is Unit -> writableMap.putNull(jsKey)
        is Boolean -> writableMap.putBoolean(jsKey, value)
        is Int -> writableMap.putInt(jsKey, value)
        is Number -> writableMap.putDouble(jsKey, value.toDouble())
        is String -> writableMap.putString(jsKey, value)
        is ReadableArray -> writableMap.putArray(jsKey, value)
        is ReadableMap -> writableMap.putMap(jsKey, value)
        is Record -> writableMap.putMap(jsKey, value.toJSMap())
        is Bundle -> writableMap.putMap(jsKey, Arguments.fromBundle(value))
        is List<*> -> writableMap.putArray(jsKey, Arguments.fromList(value))
        is Array<*> -> writableMap.putArray(jsKey, Arguments.fromArray(value))
        else -> throw IllegalArgumentException("Could not convert " + value.javaClass)
      }
    }

  return writableMap
}
