package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise
import expo.modules.kotlin.methods.AnyMethod
import kotlin.reflect.KType

class PromiseMethod(
  name: String,
  argsType: Array<KType>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Unit
) : AnyMethod(name, argsType) {

  override fun call(args: ReadableArray, promise: Promise) {
    body(castArguments(args), promise)
  }
}
