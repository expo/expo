package expo.modules.benchmark

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.iterator

class BenchmarkingBridgeModule : BaseJavaModule() {
  override fun getName(): String = "BenchmarkingBridgeModule"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun nothing(): Double {
    // Do nothing

    // For some reason, isBlockingSynchronousMethod doesn't let functions be Void/Unit
    // so returning a dummy number
    return 0.0
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun addNumbers(a: Double, b: Double): Double {
    return a + b
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun addStrings(a: String, b: String): String {
    return a + b
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun foldArray(array: ReadableArray): Double {
    var sum = 0.0
    var iterator = array.iterator()
    while (iterator.hasNext()) {
      sum += iterator.next().asDouble()
    }

    return sum
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun echoObject(point: ReadableMap): WritableMap {
    val result = Arguments.createMap()
    result.putDouble("x", point.getDouble("x"))
    result.putDouble("y", point.getDouble("y"))
    return result
  }
}
