package expo.modules.mediasession

import android.os.Handler
import android.os.HandlerThread
import kotlinx.coroutines.android.asCoroutineDispatcher

internal class HandlerScheduler {
  private val thread = HandlerThread("expo-media-session").apply { start() }
  val handler = Handler(thread.looper)
  val dispatcher = handler.asCoroutineDispatcher("expo-media-session")
}
