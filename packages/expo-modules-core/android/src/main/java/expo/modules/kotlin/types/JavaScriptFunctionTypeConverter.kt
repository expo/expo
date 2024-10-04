package expo.modules.kotlin.types

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptFunction
import kotlin.reflect.KType

class JavaScriptFunctionTypeConverter<T : Any>(
  val type: KType
) : NullAwareTypeConverter<JavaScriptFunction<T>>(type.isMarkedNullable) {
  override fun convertNonOptional(value: Any, context: AppContext?): JavaScriptFunction<T> {
    @Suppress("UNCHECKED_CAST")
    val jsFunction = value as JavaScriptFunction<T>
    jsFunction.returnType = requireNotNull(type.arguments.first().type)
    return jsFunction
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType(CppType.JS_FUNCTION)

  override fun isTrivial(): Boolean = false
}
