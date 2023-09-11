package abi47_0_0.expo.modules.kotlin.functions

import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.expo.modules.kotlin.ModuleHolder
import abi47_0_0.expo.modules.kotlin.Promise
import abi47_0_0.expo.modules.kotlin.types.AnyType

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
