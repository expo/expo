package expo.modules.kotlin.views

import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.toStrongReference
import expo.modules.kotlin.types.NonNullableTypeConverter
import kotlin.reflect.KClass
import kotlin.reflect.KType

class ViewTypeConverter<T : View>(
  val type: KType
) : NonNullableTypeConverter<T>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): T {
    val appContext = context.toStrongReference()
    appContext.assertMainThread()

    val viewTag = value as Int
    val view = appContext.findView<T>(viewTag)
      ?: throw Exceptions.ViewNotFound(type.classifier as KClass<*>, viewTag)

    return view
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(
    CppType.INT,
    CppType.VIEW_TAG
  )

  override fun isTrivial(): Boolean = false
}
