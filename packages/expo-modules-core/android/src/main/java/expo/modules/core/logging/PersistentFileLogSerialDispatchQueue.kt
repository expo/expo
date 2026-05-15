package expo.modules.core.logging

import java.util.concurrent.Executors

internal typealias PersistentFileLogSerialDispatchQueueBlock = () -> Unit

internal class PersistentFileLogSerialDispatchQueue {
  fun add(block: PersistentFileLogSerialDispatchQueueBlock) {
    executor.execute(block)
  }

  companion object {
    private val executor = Executors.newSingleThreadExecutor()
  }
}
