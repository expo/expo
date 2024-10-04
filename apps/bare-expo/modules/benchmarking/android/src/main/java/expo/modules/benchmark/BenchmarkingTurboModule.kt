package expo.modules.benchmark

import com.facebook.react.bridge.ReactApplicationContext

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
}
