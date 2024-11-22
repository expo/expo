package expo.modules.kotlin.functions

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.AnyType

class AsyncFunctionWithPromiseComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AsyncFunction(name, desiredArgsTypes) {
  override fun callUserImplementation(args: Array<Any?>, promise: Promise, appContext: AppContext) {
    body(convertArgs(args, appContext), promise)
  }
}
