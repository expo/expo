package expo.modules.kotlin.views

import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Utils
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.NullArgumentException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.toStrongReference
import expo.modules.kotlin.types.TypeConverter
import kotlin.reflect.KClass
import kotlin.reflect.KType

class ViewTypeConverter<T : View>(
  val type: KType
) : TypeConverter<T>() {

  override fun convert(value: Any?, context: AppContext?): T? {
    Utils.assertMainThread()
    if (value == null) {
      if (type.isMarkedNullable) {
        return null
      }
      throw NullArgumentException()
    }

    val appContext = context.toStrongReference()
    val viewTag = value as Int
    val view = appContext.findView<T>(viewTag)
    if (!type.isMarkedNullable && view == null) {
      throw Exceptions.ViewNotFound(type.classifier as KClass<*>, viewTag)
    }

    return view
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(
    CppType.INT,
    CppType.VIEW_TAG
  )

  override fun isTrivial(): Boolean = false
}
