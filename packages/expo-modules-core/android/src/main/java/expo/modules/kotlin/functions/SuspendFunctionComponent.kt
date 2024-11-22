package expo.modules.kotlin.functions

import expo.modules.BuildConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.weak
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SuspendFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?
) : BaseAsyncFunctionComponent(name, desiredArgsTypes) {
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

      val queue = when (queue) {
        Queues.MAIN -> appContext.mainQueue
        Queues.DEFAULT -> appContext.modulesQueue
      }

      queue.launch {
        try {
          exceptionDecorator({
            FunctionCallException(name, moduleName, it)
          }) {
            val result = body.invoke(this, convertArgs(args, appContext))
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
