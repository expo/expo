package expo.modules.kotlin

import com.facebook.react.bridge.Dynamic

inline fun <T> Dynamic.recycle(block: Dynamic.() -> T): T {
  try {
    return block(this)
  } finally {
    this.recycle()
  }
}
