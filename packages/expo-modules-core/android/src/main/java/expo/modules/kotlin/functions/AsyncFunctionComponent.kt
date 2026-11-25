package expo.modules.kotlin.functions

import expo.modules.BuildConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.weak
import kotlinx.coroutines.launch

/**
 * Base class of async function components that require a promise to be called.
 */
abstract class AsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {
  internal abstract fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext)

  override fun attachToJSObject(appContext: AppContext, jsObject: JSDecoratorsBridgingObject, moduleName: String) {
    val appContextHolder = appContext.weak()
    jsObject.registerAsyncFunction(
      name,
      takesOwner,
      isEnumerable,
      desiredArgsTypes.map { it.getCppRequiredTypes() }.toTypedArray()
    ) { args, promiseImpl ->
      if (BuildConfig.DEBUG) {
        promiseImpl.decorateWithDebugInformation(
          appContextHolder,
          moduleName,
          name
        )
      }

      val functionBody = {
        try {
          exceptionDecorator({
            FunctionCallException(name, moduleName, it)
          }) {
            callUserImplementation(args, promiseImpl, appContext)
          }
        } catch (e: Throwable) {
          // The promise was resolved, so we should rethrow the error.
          if (promiseImpl.wasSettled) {
            throw e
          }
          promiseImpl.reject(e.toCodedException())
        }
      }

      dispatchOnQueue(appContext, functionBody)
    }
  }

  private fun dispatchOnQueue(appContext: AppContext, block: () -> Unit) {
    when (val queue = queue) {
      Queues.DEFAULT -> {
        appContext.modulesQueue.launch {
          block()
        }
      }

      Queues.MAIN -> {
        appContext.mainQueue.launch {
          block()
        }
      }

      is CustomQueue ->
        queue.scope.launch {
          block()
        }
    }
  }
}
