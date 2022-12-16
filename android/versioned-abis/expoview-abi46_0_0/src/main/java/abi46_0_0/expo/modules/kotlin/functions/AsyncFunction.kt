package abi46_0_0.expo.modules.kotlin.functions

import abi46_0_0.com.facebook.react.bridge.ReadableArray
import abi46_0_0.expo.modules.kotlin.AppContext
import abi46_0_0.expo.modules.kotlin.KPromiseWrapper
import abi46_0_0.expo.modules.kotlin.Promise
import abi46_0_0.expo.modules.kotlin.exception.CodedException
import abi46_0_0.expo.modules.kotlin.exception.UnexpectedException
import abi46_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi46_0_0.expo.modules.kotlin.types.AnyType
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
      val kotlinPromise = KPromiseWrapper(bridgePromise as abi46_0_0.com.facebook.react.bridge.Promise)
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
