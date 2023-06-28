package abi49_0_0.expo.modules.kotlin.functions

import abi49_0_0.com.facebook.react.bridge.ReadableArray
import abi49_0_0.expo.modules.kotlin.AppContext
import abi49_0_0.expo.modules.kotlin.exception.CodedException
import abi49_0_0.expo.modules.kotlin.exception.FunctionCallException
import abi49_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi49_0_0.expo.modules.kotlin.jni.JNIFunctionBody
import abi49_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi49_0_0.expo.modules.kotlin.types.AnyType
import abi49_0_0.expo.modules.kotlin.types.JSTypeConverter

class SyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: (args: Array<out Any?>) -> Any?
) : AnyFunction(name, desiredArgsTypes) {
  @Throws(CodedException::class)
  fun call(args: ReadableArray): Any? {
    return body(convertArgs(args))
  }

  fun call(args: Array<Any?>, appContext: AppContext? = null): Any? {
    return body(convertArgs(args, appContext))
  }

  internal fun getJNIFunctionBody(moduleName: String, appContext: AppContext?): JNIFunctionBody {
    return JNIFunctionBody { args ->
      return@JNIFunctionBody exceptionDecorator({
        FunctionCallException(name, moduleName, it)
      }) {
        val result = call(args, appContext)
        return@exceptionDecorator JSTypeConverter.convertToJSValue(result)
      }
    }
  }

  override fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject) {
    jsObject.registerSyncFunction(
      name,
      takesOwner,
      argsCount,
      getCppRequiredTypes().toTypedArray(),
      getJNIFunctionBody(jsObject.name, appContext)
    )
  }
}
