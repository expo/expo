package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import expo.modules.core.arguments.MapArguments
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class ReadableArgumentsTypeConverter() : DynamicAwareTypeConverters<ReadableArguments>() {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): ReadableArguments {
    return MapArguments((value.asMap() ?: throw DynamicCastException(ReadableMap::class)).toHashMap())
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): ReadableArguments {
    return MapArguments((value as ReadableMap).toHashMap())
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.READABLE_MAP)

  override fun isTrivial(): Boolean = false
}
