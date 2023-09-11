package expo.modules.kotlin

import android.os.Looper
import expo.modules.kotlin.exception.Exceptions

object Utils {
  @Suppress("UseExpressionBody")
  inline fun assertMainThread() {
    if (Thread.currentThread() !== Looper.getMainLooper().thread) {
      throw Exceptions.IncorrectThreadException(
        Thread.currentThread().name,
        Looper.getMainLooper().thread.name
      )
    }
  }
}

@Suppress("NOTHING_TO_INLINE")
inline fun AppContext?.toStrongReference(): AppContext {
  return this ?: throw Exceptions.AppContextLost()
}
