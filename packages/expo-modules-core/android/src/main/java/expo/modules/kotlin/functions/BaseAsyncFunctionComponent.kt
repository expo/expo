package expo.modules.kotlin.functions

import expo.modules.kotlin.types.AnyType
import kotlinx.coroutines.CoroutineScope

sealed interface FunctionQueue

enum class Queues : FunctionQueue {
  MAIN,
  DEFAULT
}

data class CustomQueue(
  val scope: CoroutineScope
) : FunctionQueue

abstract class BaseAsyncFunctionComponent(
  name: String,
  desiredArgsTypes: Array<AnyType>
) : AnyFunction(name, desiredArgsTypes) {
  protected var queue: FunctionQueue = Queues.DEFAULT

  fun runOnQueue(queue: Queues) = apply {
    this.queue = queue
  }

  fun runOnQueue(scope: CoroutineScope) = apply {
    this.queue = CustomQueue(scope)
  }
}
