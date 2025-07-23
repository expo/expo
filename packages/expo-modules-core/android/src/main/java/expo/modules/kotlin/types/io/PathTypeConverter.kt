package expo.modules.kotlin.types.io

import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.types.DynamicAwareTypeConverters
import java.nio.file.Path
import java.nio.file.Paths

@RequiresApi(Build.VERSION_CODES.O)
class PathTypeConverter : DynamicAwareTypeConverters<Path>() {
  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Path {
    val stringPath = value.asString()
    return Paths.get(stringPath)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Path {
    val stringPath = value as String
    return Paths.get(stringPath)
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.STRING)

  override fun isTrivial() = false
}
