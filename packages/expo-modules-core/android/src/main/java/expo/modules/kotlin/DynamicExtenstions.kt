package expo.modules.kotlin

import com.facebook.react.bridge.Dynamic

inline fun <T> Dynamic.recycle(block: Dynamic.() -> T): T {
  val result = block(this)
  this.recycle()
  return result
}
