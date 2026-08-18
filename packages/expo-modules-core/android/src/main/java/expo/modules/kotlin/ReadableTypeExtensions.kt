package expo.modules.kotlin

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

fun ReadableType.toClass(): Class<*> {
  return when (this) {
    ReadableType.Null -> Any::class.java
    ReadableType.Boolean -> Boolean::class.java
    ReadableType.Number -> Number::class.java
    ReadableType.String -> String::class.java
    ReadableType.Map -> ReadableMap::class.java
    ReadableType.Array -> ReadableArray::class.java
  }
}
