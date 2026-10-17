package expo.modules.network

import android.os.Handler
import android.os.Looper

internal abstract class Monitor<T>(
  private val emitNewValueEvent: (T) -> Unit
) {
  private var monitoredValue: T? = null
  private val valueMutex = Any()
  private val emitMutex = Any()

  private val handler = Handler(Looper.getMainLooper())
  private var currentRunnable: Runnable? = null

  abstract fun register()

  private fun equalsMonitoredValue(newValue: T): Boolean =
    synchronized(valueMutex) { newValue == monitoredValue }

  protected fun setNewValue(newValue: T) =
    synchronized(valueMutex) { monitoredValue = newValue }

  private fun emitEvent(value: T) =
    synchronized(emitMutex) { emitNewValueEvent(value) }

  protected fun update(newValue: T) {
    if (equalsMonitoredValue(newValue)) return
    setNewValue(newValue)
    emitEvent(newValue)
  }

  protected fun delayedUpdate(newValue: T, delayInMs: Long) {
    handler.post {
      currentRunnable?.let { handler.removeCallbacks(it) }
      currentRunnable = Runnable { update(newValue) }.also {
        handler.postDelayed(it, delayInMs)
      }
    }
  }

  fun getValue(): T = synchronized(valueMutex) { monitoredValue ?: getErrorValue() }

  abstract fun getErrorValue(): T

  abstract fun internalUnregister()

  fun unregister() {
    internalUnregister()
    handler.post {
      currentRunnable?.let { handler.removeCallbacks(it) }
      currentRunnable = null
    }
  }
}
