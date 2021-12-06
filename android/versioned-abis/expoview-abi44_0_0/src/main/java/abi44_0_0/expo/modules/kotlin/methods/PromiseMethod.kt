package abi44_0_0.expo.modules.kotlin.methods

import abi44_0_0.expo.modules.kotlin.Promise
import abi44_0_0.expo.modules.kotlin.types.AnyType

class PromiseMethod(
  name: String,
  argsType: Array<AnyType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AnyMethod(name, argsType) {

  override fun callImplementation(args: Array<out Any?>, promise: Promise) {
    body(args, promise)
  }
}
