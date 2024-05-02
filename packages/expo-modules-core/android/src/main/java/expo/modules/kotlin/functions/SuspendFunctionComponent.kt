package expo.modules.kotlin.functions

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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SuspendFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {

  override fun call(holder: ModuleHolder<*>, args: ReadableArray, promise: Promise) {
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
    val appContextHolder = appContext.jsiInterop.appContextHolder
    val moduleName = jsObject.name
    jsObject.registerAsyncFunction(
      name,
      takesOwner,
      desiredArgsTypes.map { it.getCppRequiredTypes() }.toTypedArray()
    ) { args, promiseImpl ->
      if (BuildConfig.DEBUG) {
        promiseImpl.decorateWithDebugInformation(
          appContextHolder,
          moduleName,
          name
        )
      }

      val queue = when (queue) {
        Queues.MAIN -> appContext.mainQueue
        Queues.DEFAULT -> appContext.modulesQueue
      }

      queue.launch {
        try {
          exceptionDecorator({
            FunctionCallException(name, moduleName, it)
          }) {
            val result = body.invoke(this, convertArgs(args))
            if (isActive) {
              promiseImpl.resolve(result)
            }
          }
        } catch (e: Throwable) {
          if (promiseImpl.wasSettled) {
            throw e
          }
          promiseImpl.reject(e.toCodedException())
        }
      }
    }
  }
}
