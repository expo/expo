package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import expo.modules.core.arguments.MapArguments
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class ReadableArgumentsTypeConverter(
  isOptional: Boolean
) : DynamicAwareTypeConverters<ReadableArguments>(isOptional) {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?): ReadableArguments {
    return MapArguments(value.asMap().toHashMap())
  }

  override fun convertFromAny(value: Any, context: AppContext?): ReadableArguments {
    return MapArguments((value as ReadableMap).toHashMap())
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.READABLE_MAP)

  override fun isTrivial(): Boolean = false
}
