package expo.modules.kotlin.functions

import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class AsyncSuspendFunction(
  name: String,
  argsType: Array<AnyType>,
  scopeProvider: Lazy<CoroutineScope>,
  private val body: suspend CoroutineScope.(args: Array<out Any?>) -> Any?
) : AnyFunction(name, argsType) {
  private val scope by scopeProvider

  // TODO(@lukmccall): improve error messages
  override fun callImplementation(args: Array<out Any?>, promise: Promise) {
    scope.launch {
      try {
        val result = body.invoke(scope, args)
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
