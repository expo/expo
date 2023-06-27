package abi49_0_0.expo.modules.kotlin

import abi49_0_0.com.facebook.react.bridge.ReadableArray
import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.bridge.ReadableType
import kotlin.reflect.KType
import kotlin.reflect.full.createType

fun ReadableType.toKType(): KType {
  return when (this) {
    ReadableType.Null -> Any::class.createType(nullable = true)
    ReadableType.Boolean -> Boolean::class.createType()
    ReadableType.Number -> Number::class.createType()
    ReadableType.String -> String::class.createType()
    ReadableType.Map -> ReadableMap::class.createType()
    ReadableType.Array -> ReadableArray::class.createType()
  }
}
