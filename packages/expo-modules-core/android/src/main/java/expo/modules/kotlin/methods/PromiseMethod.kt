package expo.modules.kotlin.methods

import expo.modules.kotlin.Promise
import kotlin.reflect.KType

class PromiseMethod(
  name: String,
  argsType: Array<KType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AnyMethod(name, argsType) {

  override fun callImplementation(args: Array<out Any?>, promise: Promise) {
    body(args, promise)
  }
}
