package expo.modules.kotlin.types.net

import android.net.Uri
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.net.URI
import androidx.core.net.toUri

class UriTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<Uri>(isOptional) {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Uri {
    val stringUri = value.asString()
    return stringUri.toUri()
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Uri {
    val stringUri = value as String
    return stringUri.toUri()
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}

class JavaURITypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<URI>(isOptional) {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): URI {
    val stringUri = value.asString()
    return URI.create(stringUri)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): URI {
    val stringUri = value as String
    return URI.create(stringUri)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
