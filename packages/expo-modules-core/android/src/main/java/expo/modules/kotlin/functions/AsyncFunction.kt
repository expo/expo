package expo.modules.kotlin.functions

import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.AnyType

class AsyncFunction(
  name: String,
  argsType: Array<AnyType>,
  private val body: (args: Array<out Any?>) -> Any?
) : AnyFunction(name, argsType, isSync = false) {
  override fun callSyncImplementation(holder: ModuleHolder, args: Array<out Any?>): Any? {
    return body(args)
  }

  override fun callImplementation(holder: ModuleHolder, args: Array<out Any?>, promise: Promise) {
    promise.resolve(body(args))
  }
}
