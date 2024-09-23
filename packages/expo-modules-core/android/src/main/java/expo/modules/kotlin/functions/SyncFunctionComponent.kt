package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.jni.JNIFunctionBody
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.types.ReturnType

class SyncFunctionComponent(
  name: String,
  argTypes: Array<AnyType>,
  private val returnType: ReturnType,
  private val body: (args: Array<out Any?>) -> Any?
) : AnyFunction(name, argTypes) {
  private var shouldUseExperimentalConverter = false

  fun useExperimentalConverter(shouldUse: Boolean = true) = apply {
    shouldUseExperimentalConverter = shouldUse
  }

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
        if (shouldUseExperimentalConverter) {
          return@exceptionDecorator returnType.convertToJS(result)
        } else {
          return@exceptionDecorator JSTypeConverter.convertToJSValue(result)
        }
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
