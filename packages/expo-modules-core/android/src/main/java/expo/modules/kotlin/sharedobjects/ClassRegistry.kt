package expo.modules.kotlin.sharedobjects

import expo.modules.kotlin.jni.JavaScriptObject

class ClassRegistry {
  internal var pairs = mutableMapOf<Class<*>, JavaScriptObject>()

  internal fun add(native: Class<*>, js: JavaScriptObject) {
    js.defineDeallocator {
      delete(native)
    }
    pairs[native] = js
  }

  private fun delete(native: Class<*>) {
    pairs.remove(native)
  }
  internal fun toJavaScriptObject(native: Class<*>): JavaScriptObject? {
    return pairs[native]
  }
}
