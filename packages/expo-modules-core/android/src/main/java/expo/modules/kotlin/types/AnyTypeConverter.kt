package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.NullArgumentException
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

/**
 * Type converter that handles conversion from [Any] or [Dynamic] to [Any].
 * In the first case, it will just pass provided value.
 * In case when it receives [Dynamic], it will unpack the provided value.
 * In that way, we produce the same output for JSI and bridge implementation.
 */
class AnyTypeConverter : DynamicAwareTypeConverters<Any>() {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Any {
    return when (value.type) {
      ReadableType.Boolean -> value.asBoolean()
      ReadableType.Number -> value.asDouble()
      ReadableType.String -> value.asString() ?: throw DynamicCastException(String::class)
      ReadableType.Map -> (value.asMap() ?: throw DynamicCastException(ReadableMap::class)).toHashMap()
      ReadableType.Array -> (value.asArray() ?: throw DynamicCastException(ReadableArray::class)).toArrayList()
      ReadableType.Null -> throw NullArgumentException()
    }
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Any = value

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.ANY)
}
