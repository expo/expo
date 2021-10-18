package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise

class Method(
  name: String,
  argsType: Array<TypeInformation<*>>,
  private val body: (args: Array<out Any?>) -> Any
) : AnyMethod(name, argsType) {
  override fun call(args: ReadableArray, promise: Promise) {
    try {
      promise.resolve(body(castArguments(args)))
    } catch (e: Throwable) {
      promise.reject("ExpoModuleCore", e.message, e)
    }
  }
}
