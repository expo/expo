package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class UnitTypeConverter : TypeConverter<Unit>() {
  override fun convert(value: Any?, context: AppContext?) = Unit

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.ANY)
}
