package expo.modules.kotlin

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import kotlin.reflect.KClass

fun ReadableType.toKClass(): KClass<*> {
  return when (this) {
    ReadableType.Null -> Any::class
    ReadableType.Boolean -> Boolean::class
    ReadableType.Number -> Number::class
    ReadableType.String -> String::class
    ReadableType.Map -> ReadableMap::class
    ReadableType.Array -> ReadableArray::class
  }
}
