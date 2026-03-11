package expo.modules.kotlin.types.worklets

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.worklets.Serializable
import expo.modules.kotlin.types.NonNullableTypeConverter

class SerializableTypeConverter : NonNullableTypeConverter<Serializable>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): Serializable {
    return value as Serializable
  }

  override fun getCppRequiredTypes(): ExpectedType {
    return ExpectedType(CppType.SERIALIZABLE)
  }

  override fun isTrivial() = true
}
