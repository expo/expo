package expo.modules.kotlin.types

import expo.modules.kotlin.jni.Callback
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType

class CallbackTypeConverter : NonNullableTypeConverter<Callback>() {
  override fun convertNonNullable(value: Any, context: ConverterContext, forceConversion: Boolean): Callback {
    return value as Callback
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.CALLBACK)

  override fun isTrivial(): Boolean = false
}
