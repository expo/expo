package abi44_0_0.expo.modules.kotlin

import abi44_0_0.com.facebook.react.bridge.Dynamic

inline fun <T> Dynamic.recycle(block: Dynamic.() -> T): T {
  val result = block(this)
  this.recycle()
  return result
}
