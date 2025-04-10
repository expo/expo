package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

/**
 * Type converter that handles conversion from [Any] or [Dynamic] to [Any].
 * In the first case, it will just pass provided value.
 * In case when it receives [Dynamic], it will unpack the provided value.
 * In that way, we produce the same output for JSI and bridge implementation.
 */
class AnyTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Any>(isOptional) {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?): Any {
    return when (value.type) {
      ReadableType.Boolean -> value.asBoolean()
      ReadableType.Number -> value.asDouble()
      ReadableType.String -> value.asString()
      ReadableType.Map -> value.asMap().toHashMap()
      ReadableType.Array -> value.asArray().toArrayList()
      else -> error("Unknown dynamic type: ${value.type}")
    }
  }

  override fun convertFromAny(value: Any, context: AppContext?): Any = value

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.ANY)
}
