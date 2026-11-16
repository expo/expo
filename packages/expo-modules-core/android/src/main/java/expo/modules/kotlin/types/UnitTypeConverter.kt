package expo.modules.kotlin.types

import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class UnitTypeConverter : NonNullableTypeConverter<Unit>() {
  override fun convertNonNullable(value: Any, context: ConverterContext, forceConversion: Boolean) =
    Unit

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.ANY)
}
