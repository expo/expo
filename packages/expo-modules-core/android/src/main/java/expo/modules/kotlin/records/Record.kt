package expo.modules.kotlin.records

import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.types.putEnum
import java.lang.IllegalArgumentException
import java.lang.IllegalStateException
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.jvm.isAccessible

interface Record

fun Record.toJSMap(writableMap: WritableMap = Arguments.createMap()): ReadableMap {
  javaClass
    .kotlin
    .memberProperties.forEach { property ->
      val fieldInformation = property.findAnnotation<Field>() ?: return@forEach
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
        is Enum<*> -> writableMap.putEnum(jsKey, value)
        is Bundle -> writableMap.putMap(jsKey, Arguments.fromBundle(value))
        is Enum<*> -> writableMap.putEnum(jsKey, value)
        is List<*> -> writableMap.putArray(jsKey, Arguments.fromList(value))
        is Array<*> -> writableMap.putArray(jsKey, Arguments.fromArray(value))
        else -> throw IllegalArgumentException("Could not convert " + value.javaClass)
      }
    }

  return writableMap
}

// TODO (barthap): Move these to the right place
private fun WritableMap.putEnum(jsKey: String, enum: Enum<*>) {
  when (val jsValue = enum.toJSValue()) {
    null, is Unit -> putNull(jsKey)
    is Int -> putInt(jsKey, jsValue)
    is Number -> putDouble(jsKey, jsValue.toDouble())
    is String -> putString(jsKey, jsValue)
    else -> throw IllegalArgumentException("Could not convert " + enum.javaClass)
  }
}

private fun Enum<*>.toJSValue(): Any? {
  val primaryConstructor = requireNotNull(this::class.primaryConstructor) {
    "Cannot convert enum without the primary constructor to js value"
  }

  if (primaryConstructor.parameters.isEmpty()) {
    return this.name
  } else if (primaryConstructor.parameters.size == 1) {
    val parameterName = primaryConstructor.parameters.first().name!!
    @Suppress("UNCHECKED_CAST")
    val parameterProperty = this::class.declaredMemberProperties
      .find { it.name == parameterName } as KProperty1<Enum<*>, *>

    return parameterProperty.get(this)
  }

  throw IllegalStateException("Enum '$javaClass' cannot be used as return type (incompatible with JS)")
}
