package host.exp.exponent

import android.os.Handler

/*
 * Use this instead of directly doing `new Handler(Looper.getMainLooper())` so that we can
 * easily mock it out in tests.
 */
class ExpoHandler(private val handler: Handler) {
  fun post(r: Runnable): Boolean {
    return handler.post(r)
  }

  fun postDelayed(r: Runnable, delayMillis: Long): Boolean {
    return handler.postDelayed(r, delayMillis)
  }

  fun removeCallbacks(r: Runnable) {
    handler.removeCallbacks(r)
  }
}
