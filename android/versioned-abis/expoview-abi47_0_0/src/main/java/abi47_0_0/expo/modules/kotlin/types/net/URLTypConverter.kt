package abi47_0_0.expo.modules.kotlin.types.net

import abi47_0_0.com.facebook.react.bridge.Dynamic
import abi47_0_0.expo.modules.kotlin.jni.CppType
import abi47_0_0.expo.modules.kotlin.jni.ExpectedType
import abi47_0_0.expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.net.URL

class URLTypConverter(isOptional: Boolean) : DynamicAwareTypeConverters<URL>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): URL {
    val stringURL = value.asString()
    return URL(stringURL)
  }

  override fun convertFromAny(value: Any): URL {
    val stringURL = value as String
    return URL(stringURL)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
