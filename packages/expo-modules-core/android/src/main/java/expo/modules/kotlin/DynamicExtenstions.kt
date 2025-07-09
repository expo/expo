package expo.modules.kotlin

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType

inline fun <T> Dynamic.recycle(block: Dynamic.() -> T): T {
  try {
    return block(this)
  } finally {
    this.recycle()
  }
}

fun Dynamic.unwrap(): Any? {
  return when (this.type) {
    ReadableType.Null -> null
    ReadableType.Boolean -> this.asBoolean()
    ReadableType.Number -> this.asDouble()
    ReadableType.String -> this.asString()
    ReadableType.Array -> this.asArray()
    ReadableType.Map -> this.asMap()
  }
}
