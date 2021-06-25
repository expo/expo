package expo.modules.devlauncher.helpers

import android.os.Looper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking

@Throws(InterruptedException::class)
fun <T> runBlockingOnMainThread(block: () -> T): T {
  if (Thread.currentThread() == Looper.getMainLooper().thread) {
    return block()
  }

  // I know it looks stupid, but actually, this was made with purpose.
  // In some kotlin compiler versions, you can find a bug which causes crashes.
  // You can read more here: https://github.com/Kotlin/kotlinx.coroutines/issues/2041.
  // We store additional ref to the block to prevent `java.lang.VerifyError` from being thrown.
  @Suppress("UnnecessaryVariable")
  val blockRef = block
  return runBlocking(Dispatchers.Main) { blockRef() }
}
