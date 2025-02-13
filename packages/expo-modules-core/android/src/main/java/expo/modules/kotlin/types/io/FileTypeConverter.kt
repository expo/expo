package expo.modules.kotlin.types.io

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.io.File

class FileTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<File>(isOptional) {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?): File {
    val path = value.asString()
    return File(path)
  }

  override fun convertFromAny(value: Any, context: AppContext?): File {
    val path = value as String
    return File(path)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
