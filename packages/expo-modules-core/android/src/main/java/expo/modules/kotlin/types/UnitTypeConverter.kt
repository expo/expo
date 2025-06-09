package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class UnitTypeConverter : NonNullableTypeConverter<Unit>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean) = Unit

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.ANY)
}
