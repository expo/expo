package expo.modules.kotlin.types.worklets

import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.WorkletsSoLoader
import expo.modules.kotlin.jni.worklets.Serializable
import expo.modules.kotlin.types.ConverterContext
import expo.modules.kotlin.types.NonNullableTypeConverter

class SerializableTypeConverter : NonNullableTypeConverter<Serializable>() {
  override fun convertNonNullable(value: Any, context: ConverterContext, forceConversion: Boolean): Serializable {
    return value as Serializable
  }

  override fun getCppRequiredTypes(): ExpectedType {
    // Register the C++ converter before a function caches its argument converters.
    // Module functions can be exported before the UI worklet runtime is installed.
    WorkletsSoLoader.loadIfPresent()
    return ExpectedType(CppType.SERIALIZABLE)
  }

  override fun isTrivial() = true
}
