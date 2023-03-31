package abi48_0_0.expo.modules.kotlin.types.io

import abi48_0_0.com.facebook.react.bridge.Dynamic
import abi48_0_0.expo.modules.kotlin.jni.CppType
import abi48_0_0.expo.modules.kotlin.jni.ExpectedType
import abi48_0_0.expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.nio.file.Path
import java.nio.file.Paths

class PathTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Path>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Path {
    val stringPath = value.asString()
    return Paths.get(stringPath)
  }

  override fun convertFromAny(value: Any): Path {
    val stringPath = value as String
    return Paths.get(stringPath)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
