package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.KPromiseWrapper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.launch

/**
 * Base class of all function components that require a promise to be called.
 */
abstract class AsyncFunction(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : AnyFunction(name, desiredArgsTypes) {
  @Throws(CodedException::class)
  abstract fun call(args: ReadableArray, promise: Promise)

  abstract fun call(args: Array<Any?>, promise: Promise)

  override fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject) {
    jsObject.registerAsyncFunction(
      name,
      argsCount,
      desiredArgsTypes.map { it.getCppRequiredTypes() }.toIntArray()
    ) { args, bridgePromise ->
      val kotlinPromise = KPromiseWrapper(bridgePromise as com.facebook.react.bridge.Promise)
      appContext.modulesQueue.launch {
        try {
          call(args, kotlinPromise)
        } catch (e: CodedException) {
          kotlinPromise.reject(e)
        } catch (e: Throwable) {
          kotlinPromise.reject(UnexpectedException(e))
        }
      }
    }
  }
}
