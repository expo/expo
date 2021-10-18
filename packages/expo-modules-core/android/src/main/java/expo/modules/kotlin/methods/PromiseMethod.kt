package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise
import expo.modules.kotlin.modules.Module

class PromiseMethod(
  name: String,
  argsType: Array<TypeInformation<*>>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Any
) : AnyMethod(name, argsType) {

  override fun call(module: Module, args: ReadableArray, promise: Promise) {
    body(castArguments(module, args), promise)
  }
}
