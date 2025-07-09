package expo.modules.kotlin.functions

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.JNIFunctionBody
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.ReturnType

class SyncFunctionComponent(
  name: String,
  argTypes: Array<AnyType>,
  private val returnType: ReturnType,
  private val body: (args: Array<out Any?>) -> Any?
) : AnyFunction(name, argTypes) {
  fun callUserImplementation(args: Array<Any?>, appContext: AppContext? = null): Any? {
    return body(convertArgs(args, appContext))
  }

  internal fun getJNIFunctionBody(moduleName: String, appContext: AppContext?): JNIFunctionBody {
    return JNIFunctionBody { args ->
      return@JNIFunctionBody exceptionDecorator({
        FunctionCallException(name, moduleName, it)
      }) {
        val result = callUserImplementation(args, appContext)
        return@exceptionDecorator returnType.convertToJS(result)
      }
    }
  }

  override fun attachToJSObject(appContext: AppContext, jsObject: JSDecoratorsBridgingObject, moduleName: String) {
    jsObject.registerSyncFunction(
      name,
      takesOwner,
      isEnumerable,
      getCppRequiredTypes().toTypedArray(),
      getJNIFunctionBody(moduleName, appContext)
    )
  }
}
