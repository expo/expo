package abi46_0_0.expo.modules.kotlin

import abi46_0_0.com.facebook.react.bridge.Dynamic

inline fun <T> Dynamic.recycle(block: Dynamic.() -> T): T {
  try {
    return block(this)
  } finally {
    this.recycle()
  }
}
