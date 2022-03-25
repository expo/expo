package expo.modules.kotlin.functions

import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.AnyType

class AsyncFunctionWithPromise(
  name: String,
  argsType: Array<AnyType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AnyFunction(name, argsType) {
  override fun callImplementation(holder: ModuleHolder, args: Array<out Any?>, promise: Promise) {
    body(args, promise)
  }
}
