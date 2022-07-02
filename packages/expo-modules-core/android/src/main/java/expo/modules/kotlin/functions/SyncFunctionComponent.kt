package expo.modules.kotlin.functions

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.JSTypeConverter

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
      getCppRequiredTypes()
    ) { args ->
      val result = call(args)
      val convertedResult = JSTypeConverter.convertToJSValue(result)
      return@registerSyncFunction Arguments.fromJavaArgs(arrayOf(convertedResult))
    }
  }
}
