package expo.modules.kotlin.functions

import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.FunctionCallException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class AsyncSuspendFunction(
  name: String,
  argsType: Array<AnyType>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?
) : AnyFunction(name, argsType) {
  override fun callImplementation(holder: ModuleHolder, args: Array<out Any?>, promise: Promise) {
    val scope = holder.module.coroutineScopeDelegate.value
    scope.launch {
      try {
        val result = exceptionDecorator({ cause -> FunctionCallException(name, holder.name, cause) }) {
          body.invoke(scope, args)
        }
        if (isActive) {
          promise.resolve(result)
        }
      } catch (e: CodedException) {
        promise.reject(e)
      } catch (e: Throwable) {
        promise.reject(UnexpectedException(e))
      }
    }
  }
}
