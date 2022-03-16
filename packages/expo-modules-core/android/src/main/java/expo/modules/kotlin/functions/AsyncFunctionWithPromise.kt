package expo.modules.kotlin.functions

import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.AnyType

class AsyncFunctionWithPromise(
  name: String,
  argsType: Array<AnyType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AnyFunction(name, argsType) {
  override fun callImplementation(args: Array<out Any?>, promise: Promise) {
    body(args, promise)
  }
}
