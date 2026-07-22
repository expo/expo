package expo.modules.kotlin.views

import android.view.View
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.types.ConverterContext
import expo.modules.kotlin.types.NonNullableTypeConverter
import expo.modules.kotlin.types.descriptors.TypeDescriptor

class ViewTypeConverter<T : View>(
  val typeDescriptor: TypeDescriptor
) : NonNullableTypeConverter<T>() {
  override fun convertNonNullable(value: Any, context: ConverterContext, forceConversion: Boolean): T {
    context.assertMainThread()

    val viewTag = value as Int
    val view = context.findView<T>(viewTag)
      ?: throw Exceptions.ViewNotFound(typeDescriptor.jClass, viewTag)

    return view
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(
    CppType.INT,
    CppType.VIEW_TAG
  )

  override fun isTrivial(): Boolean = false
}
