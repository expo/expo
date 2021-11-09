package expo.modules.kotlin.methods

import expo.modules.kotlin.Promise
import kotlin.reflect.KType

class Method(
  name: String,
  argsType: Array<KType>,
  private val body: (args: Array<out Any?>) -> Any?
) : AnyMethod(name, argsType) {
  override fun callImplementation(args: Array<out Any?>, promise: Promise) {
    promise.resolve(body(args))
  }
}
