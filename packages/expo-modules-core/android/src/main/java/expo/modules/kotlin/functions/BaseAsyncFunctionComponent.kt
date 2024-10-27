package expo.modules.kotlin.functions

import expo.modules.kotlin.types.AnyType

enum class Queues {
  MAIN,
  DEFAULT
}

abstract class BaseAsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : AnyFunction(name, desiredArgsTypes) {
  protected var queue = Queues.DEFAULT

  fun runOnQueue(queue: Queues) = apply {
    this.queue = queue
  }
}
