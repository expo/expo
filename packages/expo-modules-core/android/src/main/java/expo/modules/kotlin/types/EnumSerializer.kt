package expo.modules.kotlin.types

import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor

fun WritableMap.putEnum(jsKey: String, enum: Enum<*>) {
  when (val jsValue = enum.toJSValue()) {
    null, is Unit -> putNull(jsKey)
    is Int -> putInt(jsKey, jsValue)
    is Number -> putDouble(jsKey, jsValue.toDouble())
    is String -> putString(jsKey, jsValue)
    else -> throw IllegalArgumentException("Could not convert " + enum.javaClass)
  }
}

fun WritableArray.pushEnum(enum: Enum<*>) {
  when (val jsValue = enum.toJSValue()) {
    null, is Unit -> pushNull()
    is Int -> pushInt(jsValue)
    is Number -> pushDouble(jsValue.toDouble())
    is String -> pushString(jsValue)
    else -> throw IllegalArgumentException("Could not convert " + enum.javaClass)
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
