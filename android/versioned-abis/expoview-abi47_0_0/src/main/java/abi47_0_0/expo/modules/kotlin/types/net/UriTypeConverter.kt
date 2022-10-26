package abi47_0_0.expo.modules.kotlin.types.net

import android.net.Uri
import abi47_0_0.com.facebook.react.bridge.Dynamic
import abi47_0_0.expo.modules.kotlin.jni.CppType
import abi47_0_0.expo.modules.kotlin.jni.ExpectedType
import abi47_0_0.expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.net.URI

class UriTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Uri>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): Uri {
    val stringUri = value.asString()
    return Uri.parse(stringUri)
  }

  override fun convertFromAny(value: Any): Uri {
    val stringUri = value as String
    return Uri.parse(stringUri)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}

class JavaURITypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<URI>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): URI {
    val stringUri = value.asString()
    return URI.create(stringUri)
  }

  override fun convertFromAny(value: Any): URI {
    val stringUri = value as String
    return URI.create(stringUri)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
