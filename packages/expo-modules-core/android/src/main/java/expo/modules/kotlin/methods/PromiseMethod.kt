package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise

class PromiseMethod(
  name: String,
  argsType: Array<TypeInformation<*>>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Any
) : AnyMethod(name, argsType) {

  override fun call(args: ReadableArray, promise: Promise) {
    body(castArguments(args), promise)
  }
}
