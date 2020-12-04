package expo.modules.developmentclient.helpers

import android.os.Looper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking

@Throws(InterruptedException::class)
fun <T> runBlockingOnMainThread(block: () -> T): T {
  if (Thread.currentThread() == Looper.getMainLooper().thread) {
    return block()
  }

  return runBlocking(Dispatchers.Main) { block() }
}
