package abi48_0_0.expo.modules.kotlin.functions

import abi48_0_0.com.facebook.react.bridge.ReadableArray
import abi48_0_0.expo.modules.kotlin.Promise
import abi48_0_0.expo.modules.kotlin.exception.CodedException
import abi48_0_0.expo.modules.kotlin.types.AnyType

class AsyncFunctionWithPromiseComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AsyncFunction(name, desiredArgsTypes) {
  @Throws(CodedException::class)
  override fun callUserImplementation(args: ReadableArray, promise: Promise) {
    body(convertArgs(args), promise)
  }

  override fun callUserImplementation(args: Array<Any?>, promise: Promise) {
    body(convertArgs(args), promise)
  }
}
