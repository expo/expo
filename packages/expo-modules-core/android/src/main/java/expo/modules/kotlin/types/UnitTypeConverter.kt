package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class UnitTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Any>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Any {
    return Unit
  }

  override fun convertFromAny(value: Any): Any = Unit

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.ANY)
}
