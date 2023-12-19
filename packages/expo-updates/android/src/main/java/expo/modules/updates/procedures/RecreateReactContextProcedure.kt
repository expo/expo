package expo.modules.updates.procedures

import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactNativeHost
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.statemachine.UpdatesStateEvent
import java.lang.ref.WeakReference

class RecreateReactContextProcedure(
  private val reactNativeHost: WeakReference<ReactNativeHost>?,
  private val callback: Launcher.LauncherCallback
) : StateMachineProcedure() {
  override fun run(procedureContext: ProcedureContext) {
    val host = reactNativeHost?.get()
    if (host == null) {
      callback.onFailure(Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."))
      return
    }

    procedureContext.processStateEvent(UpdatesStateEvent.Restart())

    val instanceManager = host.reactInstanceManager
    callback.onSuccess()
    val handler = Handler(Looper.getMainLooper())
    handler.post { instanceManager.recreateReactContextInBackground() }
    procedureContext.resetState()
    procedureContext.onComplete()
  }
}
