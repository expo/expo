package expo.modules.kotlin.types.io

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.io.File

class FileTypeConverter : DynamicAwareTypeConverters<File>() {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): File {
    val path = value.asString()
      ?: throw Exceptions.IllegalArgument("Cannot convert ${value.type} to File")
    return File(path)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): File {
    val path = value as String
    return File(path)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
