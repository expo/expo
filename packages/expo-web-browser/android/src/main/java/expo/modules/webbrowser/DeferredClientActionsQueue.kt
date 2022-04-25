package expo.modules.webbrowser

import expo.modules.core.interfaces.Consumer
import java.util.*

class DeferredClientActionsQueue<T> {
  private val actions: Queue<Consumer<T>> = LinkedList()
  private var client: T? = null

  fun executeOrQueueAction(action: Consumer<T>) {
    if (client != null) {
      action.apply(client)
    } else {
      addActionToQueue(action)
    }
  }

  fun setClient(client: T) {
    this.client = client
    executeQueuedActions()
  }

  fun clear() {
    client = null
    actions.clear()
  }

  fun hasClient(): Boolean = client != null

  private fun executeQueuedActions() {
    if (client == null) {
      return
    }

    var action = actions.poll()
    while (action != null) {
      action.apply(client)
      action = actions.poll()
    }
  }

  private fun addActionToQueue(consumer: Consumer<T>) {
    actions.add(consumer)
  }
}