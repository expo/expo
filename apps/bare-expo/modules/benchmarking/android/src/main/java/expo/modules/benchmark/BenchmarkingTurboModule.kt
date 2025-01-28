package expo.modules.benchmark

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.iterator

class BenchmarkingTurboModule(reactContext: ReactApplicationContext) : NativeBenchmarkingTurboModuleSpec(reactContext) {
  override fun getName(): String {
    return "BenchmarkingTurboModule"
  }

  override fun nothing() {
    // Do nothing
  }

  override fun addNumbers(a: Double, b: Double): Double {
    return a + b
  }

  override fun addStrings(a: String?, b: String?): String? {
    return a + b
  }

  override fun foldArray(array: ReadableArray): Double {
    var sum = 0.0
    var iterator = array.iterator()
    while (iterator.hasNext()) {
      sum += iterator.next().asDouble()
    }

    return sum
  }
}
