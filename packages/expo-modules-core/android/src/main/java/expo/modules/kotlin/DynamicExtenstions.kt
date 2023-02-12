package expo.modules.kotlin

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject

inline fun <T> Dynamic.recycle(block: Dynamic.() -> T): T {
  try {
    return block(this)
  } finally {
    this.recycle()
  }
}

val DynamicNull = DynamicFromObject(null)
