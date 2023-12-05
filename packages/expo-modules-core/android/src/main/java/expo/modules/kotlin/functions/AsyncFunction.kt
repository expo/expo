package expo.modules.kotlin.functions

import android.view.View
import com.facebook.react.bridge.ReadableArray
import expo.modules.BuildConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.launch

/**
 * Base class of async function components that require a promise to be called.
 */
abstract class AsyncFunction(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {

  override fun call(holder: ModuleHolder<*>, args: ReadableArray, promise: Promise) {
    val queue = when (queue) {
      Queues.MAIN -> holder.module.appContext.mainQueue
      Queues.DEFAULT -> null
    }

    if (queue == null) {
      callUserImplementation(args, promise)
    } else {
      queue.launch {
        try {
          exceptionDecorator({
            FunctionCallException(name, holder.name, it)
          }) {
            callUserImplementation(args, promise)
          }
        } catch (e: CodedException) {
          promise.reject(e)
        } catch (e: Throwable) {
          promise.reject(UnexpectedException(e))
        }
      }
    }
  }

  @Throws(CodedException::class)
  internal abstract fun callUserImplementation(args: ReadableArray, promise: Promise)

  internal abstract fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext)

  override fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject) {
    val appContextHolder = appContext.jsiInterop.appContextHolder
    val moduleName = jsObject.name
    jsObject.registerAsyncFunction(
      name,
      takesOwner,
      argsCount,
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
    when (queue) {
      Queues.DEFAULT -> {
        appContext.modulesQueue.launch {
          block()
        }
      }

      Queues.MAIN -> {
        if (!BuildConfig.IS_NEW_ARCHITECTURE_ENABLED && desiredArgsTypes.any { it.inheritFrom<View>() }) {
          // On certain occasions, invoking a function on a view could lead to an error
          // because of the asynchronous communication between the JavaScript and native components.
          // In such cases, the native view may not have been mounted yet,
          // but the JavaScript code has already received the future tag of the view.
          // To avoid this issue, we have decided to temporarily utilize
          // the UIManagerModule for dispatching functions on the main thread.
          appContext.dispatchOnMainUsingUIManager(block)
          return
        }

        appContext.mainQueue.launch {
          block()
        }
      }
    }
  }
}
