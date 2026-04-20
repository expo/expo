package expo.modules.ui.state

import android.util.Log
import expo.modules.kotlin.jni.worklets.Worklet
import expo.modules.kotlin.sharedobjects.SharedObject

/**
 * A SharedObject that wraps a Worklet function.
 * Passable as a view prop via integer ID — survives React's prop serialization.
 * The view resolves it and executes the worklet on the UI runtime.
 */
class WorkletCallback : SharedObject() {
  var worklet: Worklet? = null

  fun invoke(vararg arguments: Any?) {
    val worklet = worklet ?: run {
        Log.w("ExpoUI", "WorkletCallback.invoke: worklet is nil, the callback will not run.")
        return
    }
    val runtime = appContext?.uiRuntime ?: run {
        Log.w("ExpoUI", "WorkletCallback.invoke: UI worklet runtime is not available, the callback will not run.")
        return
    }
    worklet.execute(runtime, *arguments)
  }
}
