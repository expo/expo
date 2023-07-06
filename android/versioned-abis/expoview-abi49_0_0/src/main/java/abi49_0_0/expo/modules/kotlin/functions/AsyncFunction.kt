package abi49_0_0.expo.modules.kotlin.functions

import abi49_0_0.com.facebook.react.bridge.ReactContext
import abi49_0_0.com.facebook.react.bridge.ReadableArray
import abi49_0_0.com.facebook.react.uimanager.UIManagerHelper
import abi49_0_0.com.facebook.react.uimanager.UIManagerModule
import abi49_0_0.com.facebook.react.uimanager.common.UIManagerType
import host.exp.expoview.BuildConfig
import abi49_0_0.expo.modules.kotlin.AppContext
import abi49_0_0.expo.modules.kotlin.ModuleHolder
import abi49_0_0.expo.modules.kotlin.Promise
import abi49_0_0.expo.modules.kotlin.exception.CodedException
import abi49_0_0.expo.modules.kotlin.exception.Exceptions
import abi49_0_0.expo.modules.kotlin.exception.FunctionCallException
import abi49_0_0.expo.modules.kotlin.exception.UnexpectedException
import abi49_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi49_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi49_0_0.expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.launch

/**
 * Base class of async function components that require a promise to be called.
 */
abstract class AsyncFunction(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {

  override fun call(holder: ModuleHolder, args: ReadableArray, promise: Promise) {
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
    jsObject.registerAsyncFunction(
      name,
      takesOwner,
      argsCount,
      desiredArgsTypes.map { it.getCppRequiredTypes() }.toTypedArray()
    ) { args, bridgePromise ->
      val functionBody = {
        try {
          exceptionDecorator({
            FunctionCallException(name, jsObject.name, it)
          }) {
            callUserImplementation(args, bridgePromise, appContext)
          }
        } catch (e: CodedException) {
          bridgePromise.reject(e)
        } catch (e: Throwable) {
          bridgePromise.reject(UnexpectedException(e))
        }
      }

      if (queue == Queues.MAIN) {
        if (!BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
          // On certain occasions, invoking a function on a view could lead to an error
          // because of the asynchronous communication between the JavaScript and native components.
          // In such cases, the native view may not have been mounted yet,
          // but the JavaScript code has already received the future tag of the view.
          // To avoid this issue, we have decided to temporarily utilize
          // the UIManagerModule for dispatching functions on the main thread.
          val uiManager = UIManagerHelper.getUIManagerForReactTag(
            appContext.reactContext as? ReactContext ?: throw Exceptions.ReactContextLost(),
            UIManagerType.DEFAULT
          ) as UIManagerModule

          uiManager.addUIBlock {
            functionBody()
          }
          return@registerAsyncFunction
        }

        appContext.mainQueue.launch {
          functionBody()
        }
      } else {
        appContext.modulesQueue.launch {
          functionBody()
        }
      }
    }
  }
}
