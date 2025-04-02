package expo.modules.kotlin.types

import android.net.Uri
import android.os.Bundle
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import java.net.URI
import java.net.URL
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.memberProperties
import kotlin.reflect.full.primaryConstructor
import kotlin.reflect.jvm.isAccessible

fun Record.toJSValueExperimental(): Map<String, Any?> {
  val result = mutableMapOf<String, Any?>()

  javaClass
    .kotlin
    .memberProperties.map { property ->
      val fieldInformation = property.findAnnotation<Field>() ?: return@map
      val jsKey = fieldInformation.key.takeUnless { it == "" } ?: property.name

      property.isAccessible = true

      val value = property.get(this)
      val convertedValue = JSTypeConverter.convertToJSValue(value, useExperimentalConverter = true)
      result[jsKey] = convertedValue
    }

  return result
}

fun Record.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableMap {
  val result = containerProvider.createMap()

  javaClass
    .kotlin
    .memberProperties.map { property ->
      val fieldInformation = property.findAnnotation<Field>() ?: return@map
      val jsKey = fieldInformation.key.takeUnless { it == "" } ?: property.name

      property.isAccessible = true

      val value = property.get(this)
      val convertedValue = JSTypeConverter.legacyConvertToJSValue(value, containerProvider)
      result.putGeneric(jsKey, convertedValue)
    }

  return result
}

fun Bundle.toJSValueExperimental(): Map<String, Any?> {
  val result = mutableMapOf<String, Any?>()

  for (key in keySet()) {
    @Suppress("DEPRECATION")
    val value = get(key)
    val convertedValue = JSTypeConverter.convertToJSValue(value, useExperimentalConverter = true)
    result[key] = convertedValue
  }

  return result
}

fun Bundle.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableMap {
  val result = containerProvider.createMap()

  for (key in keySet()) {
    @Suppress("DEPRECATION")
    val value = get(key)
    val convertedValue = JSTypeConverter.legacyConvertToJSValue(value, containerProvider)
    result.putGeneric(key, convertedValue)
  }

  return result
}

fun <K, V> Map<K, V>.toJSValueExperimental(): Map<String, Any?> {
  return this.map { (key, value) ->
    key.toString() to JSTypeConverter.convertToJSValue(value, useExperimentalConverter = true)
  }.toMap()
}

fun <K, V> Map<K, V>.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableMap {
  val result = containerProvider.createMap()

  for ((key, value) in entries) {
    val convertedValue = JSTypeConverter.legacyConvertToJSValue(value, containerProvider)
    result.putGeneric(key.toString(), convertedValue)
  }

  return result
}

fun <T> Collection<T>.toJSValueExperimental(): Collection<Any?> {
  return this.map { JSTypeConverter.convertToJSValue(it, useExperimentalConverter = true) }
}

fun <T> Collection<T>.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  val result = containerProvider.createArray()

  for (value in this) {
    val convertedValue = JSTypeConverter.legacyConvertToJSValue(value, containerProvider)
    result.putGeneric(convertedValue)
  }

  return result
}

fun <T> Array<T>.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  val result = containerProvider.createArray()

  for (value in this) {
    val convertedValue = JSTypeConverter.legacyConvertToJSValue(value, containerProvider)
    result.putGeneric(convertedValue)
  }

  return result
}

fun IntArray.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  return containerProvider.createArray().also {
    for (value in this) {
      it.pushInt(value)
    }
  }
}

fun LongArray.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  return containerProvider.createArray().also {
    for (value in this) {
      it.pushLong(value)
    }
  }
}

fun FloatArray.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  return containerProvider.createArray().also {
    for (value in this) {
      it.pushDouble(value.toDouble())
    }
  }
}

fun DoubleArray.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  return containerProvider.createArray().also {
    for (value in this) {
      it.pushDouble(value)
    }
  }
}

fun BooleanArray.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  return containerProvider.createArray().also {
    for (value in this) {
      it.pushBoolean(value)
    }
  }
}

fun Enum<*>.toJSValue(): Any? {
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

fun URL.toJSValue(): String {
  return toString()
}

fun Uri.toJSValue(): String {
  return toString()
}

fun URI.toJSValue(): String {
  return toString()
}

fun File.toJSValue(): String {
  return absolutePath
}

fun Pair<*, *>.toJSValue(containerProvider: JSTypeConverter.ContainerProvider): WritableArray {
  return containerProvider.createArray().also {
    val convertedFirst = JSTypeConverter.legacyConvertToJSValue(first, containerProvider)
    val convertedSecond = JSTypeConverter.legacyConvertToJSValue(second, containerProvider)
    it.putGeneric(convertedFirst)
    it.putGeneric(convertedSecond)
  }
}

internal fun WritableMap.putGeneric(key: String, value: Any?) {
  when (value) {
    null, is Unit -> putNull(key)
    is ReadableArray -> putArray(key, value)
    is ReadableMap -> putMap(key, value)
    is String -> putString(key, value)
    is Int -> putInt(key, value)
    is Long -> putLong(key, value)
    is Number -> putDouble(key, value.toDouble())
    is Boolean -> putBoolean(key, value)
    else -> throw IllegalArgumentException("Could not put '${value.javaClass}' to WritableMap")
  }
}

internal fun WritableArray.putGeneric(value: Any?) {
  when (value) {
    null, is Unit -> pushNull()
    is ReadableArray -> pushArray(value)
    is ReadableMap -> pushMap(value)
    is String -> pushString(value)
    is Int -> pushInt(value)
    is Long -> pushLong(value)
    is Number -> pushDouble(value.toDouble())
    is Boolean -> pushBoolean(value)
    else -> throw IllegalArgumentException("Could not put '${value.javaClass}' to WritableArray")
  }
}
