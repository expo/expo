package expo.modules.kotlin.methods

import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.AnyType

class PromiseMethod(
  name: String,
  argsType: Array<AnyType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AnyMethod(name, argsType) {

  override fun callImplementation(args: Array<out Any?>, promise: Promise) {
    body(args, promise)
  }
}
