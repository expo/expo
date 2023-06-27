package abi49_0_0.expo.modules.kotlin.types

import abi49_0_0.expo.modules.kotlin.AppContext
import abi49_0_0.expo.modules.kotlin.jni.CppType
import abi49_0_0.expo.modules.kotlin.jni.ExpectedType
import abi49_0_0.expo.modules.kotlin.jni.JavaScriptFunction
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
