package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class DurationTypeConverter : DynamicAwareTypeConverters<Duration>() {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Duration {
    if (value.type != ReadableType.Number) {
      throw IllegalArgumentException("Expected a number, but received ${value.type}")
    }
    return value.asDouble().toDuration(DurationUnit.SECONDS)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Duration {
    return (value as Double).toDuration(DurationUnit.SECONDS)
  }

  override fun getCppRequiredTypes() = ExpectedType(CppType.DOUBLE)

  override fun isTrivial(): Boolean = false
}
