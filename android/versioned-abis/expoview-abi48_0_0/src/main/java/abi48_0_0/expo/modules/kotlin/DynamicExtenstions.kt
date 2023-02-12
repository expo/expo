package abi48_0_0.expo.modules.kotlin

import abi48_0_0.com.facebook.react.bridge.Dynamic
import abi48_0_0.com.facebook.react.bridge.DynamicFromObject

inline fun <T> Dynamic.recycle(block: Dynamic.() -> T): T {
  try {
    return block(this)
  } finally {
    this.recycle()
  }
}

val DynamicNull = DynamicFromObject(null)
