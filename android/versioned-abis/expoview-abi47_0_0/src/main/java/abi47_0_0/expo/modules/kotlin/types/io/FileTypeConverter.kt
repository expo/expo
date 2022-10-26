package abi47_0_0.expo.modules.kotlin.types.io

import abi47_0_0.com.facebook.react.bridge.Dynamic
import abi47_0_0.expo.modules.kotlin.jni.CppType
import abi47_0_0.expo.modules.kotlin.jni.ExpectedType
import abi47_0_0.expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.io.File

class FileTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<File>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): File {
    val path = value.asString()
    return File(path)
  }

  override fun convertFromAny(value: Any): File {
    val path = value as String
    return File(path)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
