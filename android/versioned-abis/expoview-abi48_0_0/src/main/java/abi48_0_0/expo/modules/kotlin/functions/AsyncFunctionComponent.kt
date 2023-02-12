package abi48_0_0.expo.modules.kotlin.functions

import abi48_0_0.com.facebook.react.bridge.ReadableArray
import abi48_0_0.expo.modules.kotlin.Promise
import abi48_0_0.expo.modules.kotlin.exception.CodedException
import abi48_0_0.expo.modules.kotlin.types.AnyType

class AsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>,
  private val body: (args: Array<out Any?>) -> Any?
) : AsyncFunction(name, desiredArgsTypes) {
  @Throws(CodedException::class)
  override fun callUserImplementation(args: ReadableArray, promise: Promise) {
    promise.resolve(body(convertArgs(args)))
  }

  override fun callUserImplementation(args: Array<Any?>, promise: Promise) {
    promise.resolve(body(convertArgs(args)))
  }
}
