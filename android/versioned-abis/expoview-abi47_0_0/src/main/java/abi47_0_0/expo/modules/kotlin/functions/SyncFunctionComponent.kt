package abi47_0_0.expo.modules.kotlin.functions

import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.expo.modules.kotlin.AppContext
import abi47_0_0.expo.modules.kotlin.exception.CodedException
import abi47_0_0.expo.modules.kotlin.exception.FunctionCallException
import abi47_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi47_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi47_0_0.expo.modules.kotlin.types.AnyType
import abi47_0_0.expo.modules.kotlin.types.JSTypeConverter

class SyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: (args: Array<out Any?>) -> Any?
) : AnyFunction(name, desiredArgsTypes) {
  @Throws(CodedException::class)
  fun call(args: ReadableArray): Any? {
    return body(convertArgs(args))
  }

  fun call(args: Array<Any?>): Any? {
    return body(convertArgs(args))
  }

  override fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject) {
    jsObject.registerSyncFunction(
      name,
      argsCount,
      getCppRequiredTypes().toTypedArray()
    ) { args ->
      return@registerSyncFunction exceptionDecorator({
        FunctionCallException(name, jsObject.name, it)
      }) {
        val result = call(args)
        return@exceptionDecorator JSTypeConverter.convertToJSValue(result)
      }
    }
  }
}
