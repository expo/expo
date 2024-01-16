package expo.modules.core.logging

import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

internal typealias PersistentFileLogSerialDispatchQueueBlock = () -> Unit

internal class PersistentFileLogSerialDispatchQueue {
  private val channel = Channel<PersistentFileLogSerialDispatchQueueBlock>(Channel.BUFFERED)

  // Queue a block in the channel
  fun add(block: PersistentFileLogSerialDispatchQueueBlock) = runBlocking { channel.send(block) }

  fun stop() = queueRunner.cancel()

  // On creation, this starts and runs for the lifetime of the app, pulling blocks off the channel
  // and running them as needed
  @OptIn(DelicateCoroutinesApi::class)
  private val queueRunner = GlobalScope.launch {
    while (true) {
      channel.receive()()
    }
  }
}
