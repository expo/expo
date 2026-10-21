package expo.modules.hinge

import androidx.annotation.MainThread
import expo.modules.kotlin.jni.worklets.Worklet
import expo.modules.kotlin.runtime.WorkletRuntime

/**
 * Worklets that run on the UI runtime with every hinge change. Call `dispatch` on the main thread,
 * which runs the UI runtime, so the worklets run synchronously with the change.
 */
internal class HingeWorkletListeners {
  private val lock = Any()
  private var nextId = 0
  private val listeners = mutableMapOf<Int, Worklet>()

  fun add(worklet: Worklet): Int = synchronized(lock) {
    nextId += 1
    listeners[nextId] = worklet
    nextId
  }

  fun remove(id: Int) {
    synchronized(lock) { listeners.remove(id) }
  }

  fun clear() {
    synchronized(lock) { listeners.clear() }
  }

  @MainThread
  fun dispatch(hinge: HingeState?, runtime: () -> WorkletRuntime) {
    val worklets = synchronized(lock) { listeners.values.toList() }
    invoke(worklets, hinge, runtime)
  }

  @MainThread
  fun dispatch(id: Int, hinge: HingeState?, runtime: () -> WorkletRuntime) {
    val worklet = synchronized(lock) { listeners[id] } ?: return
    invoke(listOf(worklet), hinge, runtime)
  }

  private fun invoke(worklets: List<Worklet>, hinge: HingeState?, runtime: () -> WorkletRuntime) {
    if (worklets.isEmpty()) {
      return
    }
    val uiRuntime = runtime()
    val event = mapOf("hinge" to hinge)
    worklets.forEach { it.execute(uiRuntime, event) }
  }
}
