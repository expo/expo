package expo.modules.updates

typealias MethodExecution = (onFinished: () -> Unit) -> Unit

class MethodExecutorQueue {
  private data class MethodInvocationHolder(val block: MethodExecution, val onComplete: MethodInvocationHolder.() -> Unit) {
    fun execute() {
      block {
        onComplete(this)
      }
    }
  }

  private val internalQueue = ArrayDeque<MethodInvocationHolder>()

  private var currentMethodInvocation: MethodInvocationHolder? = null

  fun execute(block: (onFinished: () -> Unit) -> Unit) {
    internalQueue.add(MethodInvocationHolder(block) {
      assert(currentMethodInvocation == this)
      currentMethodInvocation = null
      maybeProcessQueue()
    })

    maybeProcessQueue()
  }

  @Synchronized
  private fun maybeProcessQueue() {
    if (currentMethodInvocation != null) {
      return
    }

    val nextMethodInvocation = internalQueue.removeFirstOrNull() ?: return
    currentMethodInvocation = nextMethodInvocation
    nextMethodInvocation.execute() // need to make sure this is asynchronous
  }
}