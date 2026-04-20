package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JSCallback

/**
 * Type converter for JSCallback parameters.
 */
class JSCallbackTypeConverter : NonNullableTypeConverter<JSCallback>() {
  override fun convertNonNullable(value: Any, context: AppContext?, forceConversion: Boolean): JSCallback {
    return value as JSCallback
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.JS_CALLBACK)

  override fun isTrivial(): Boolean = false
}
