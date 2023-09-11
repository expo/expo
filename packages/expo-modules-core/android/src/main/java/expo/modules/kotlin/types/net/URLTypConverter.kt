package expo.modules.kotlin.types.net

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.types.DynamicAwareTypeConverters
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
