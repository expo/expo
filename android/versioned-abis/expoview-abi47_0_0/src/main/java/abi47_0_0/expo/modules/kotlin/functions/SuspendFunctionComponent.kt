package abi47_0_0.expo.modules.kotlin.functions

import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.expo.modules.kotlin.AppContext
import abi47_0_0.expo.modules.kotlin.ModuleHolder
import abi47_0_0.expo.modules.kotlin.Promise
import abi47_0_0.expo.modules.kotlin.exception.CodedException
import abi47_0_0.expo.modules.kotlin.exception.FunctionCallException
import abi47_0_0.expo.modules.kotlin.exception.UnexpectedException
import abi47_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi47_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi47_0_0.expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SuspendFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {

  override fun call(holder: ModuleHolder, args: ReadableArray, promise: Promise) {
    val appContext = holder.module.appContext
    val queue = when (queue) {
      Queues.MAIN -> appContext.mainQueue
      Queues.DEFAULT -> appContext.modulesQueue
    }

    queue.launch {
      try {
        exceptionDecorator({
          FunctionCallException(name, holder.name, it)
        }) {
          val result = body.invoke(this, convertArgs(args))
          if (isActive) {
            promise.resolve(result)
          }
        }
      } catch (e: CodedException) {
        promise.reject(e)
      } catch (e: Throwable) {
        promise.reject(UnexpectedException(e))
      }
    }
  }

  override fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject) {
    jsObject.registerAsyncFunction(
      name,
      argsCount,
      desiredArgsTypes.map { it.getCppRequiredTypes() }.toTypedArray()
    ) { args, bridgePromise ->
      val queue = when (queue) {
        Queues.MAIN -> appContext.mainQueue
        Queues.DEFAULT -> appContext.modulesQueue
      }

      queue.launch {
        try {
          exceptionDecorator({
            FunctionCallException(name, jsObject.name, it)
          }) {
            val result = body.invoke(this, convertArgs(args))
            if (isActive) {
              bridgePromise.resolve(result)
            }
          }
        } catch (e: CodedException) {
          bridgePromise.reject(e)
        } catch (e: Throwable) {
          bridgePromise.reject(UnexpectedException(e))
        }
      }
    }
  }
}
