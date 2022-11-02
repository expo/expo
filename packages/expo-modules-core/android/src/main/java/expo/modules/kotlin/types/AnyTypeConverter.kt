package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.jni.ExpectedType

/**
 * Type converter that handles conversion from [Any] or [Dynamic] to [Any].
 * In the first case, it will just pass provided value.
 * In case when it receives [Dynamic], it will unpack the provided value.
 * In that way, we produce the same output for JSI and bridge implementation.
 */
class AnyTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Any>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Any {
    return when (value.type) {
      ReadableType.Boolean -> value.asBoolean()
      ReadableType.Number -> value.asDouble()
      ReadableType.String -> value.asString()
      ReadableType.Map -> value.asMap()
      ReadableType.Array -> value.asArray()
      else -> error("Unknown dynamic type: ${value.type}")
    }
  }

  override fun convertFromAny(value: Any): Any = value

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.forAny()
}
