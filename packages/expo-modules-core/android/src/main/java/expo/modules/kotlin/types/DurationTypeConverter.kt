package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class DurationTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Duration>(isOptional) {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?): Duration {
    if (value.type != ReadableType.Number) {
      throw IllegalArgumentException("Expected a number, but received ${value.type}")
    }
    return value.asDouble().toDuration(DurationUnit.SECONDS)
  }

  override fun convertFromAny(value: Any, context: AppContext?): Duration {
    return (value as Double).toDuration(DurationUnit.SECONDS)
  }

  override fun getCppRequiredTypes() = ExpectedType(CppType.DOUBLE)

  override fun isTrivial(): Boolean = false
}
