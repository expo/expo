package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.AnyType

enum class Queues {
  MAIN,
  DEFAULT,
}

abstract class BaseAsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : AnyFunction(name, desiredArgsTypes) {

  protected var queue = Queues.DEFAULT

  abstract fun call(holder: ModuleHolder, args: ReadableArray, promise: Promise)

  fun runOnQueue(queue: Queues) = apply {
    this.queue = queue
  }
}
