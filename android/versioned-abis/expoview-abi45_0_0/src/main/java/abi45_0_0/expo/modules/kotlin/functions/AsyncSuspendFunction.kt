package abi45_0_0.expo.modules.kotlin.functions

import abi45_0_0.expo.modules.kotlin.ModuleHolder
import abi45_0_0.expo.modules.kotlin.Promise
import abi45_0_0.expo.modules.kotlin.exception.CodedException
import abi45_0_0.expo.modules.kotlin.exception.FunctionCallException
import abi45_0_0.expo.modules.kotlin.exception.UnexpectedException
import abi45_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi45_0_0.expo.modules.kotlin.types.AnyType
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
