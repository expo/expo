package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.types.AnyType

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
