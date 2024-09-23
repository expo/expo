package expo.modules.benchmark

import com.facebook.react.bridge.BaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BenchmarkingBridgeModule : BaseJavaModule() {
  override fun getName(): String = "BenchmarkingBridgeModule"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun nothing() {
    // Do nothing
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun addNumbers(a: Double, b: Double): Double {
    return a + b
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun addStrings(a: String, b: String): String {
    return a + b
  }
}
