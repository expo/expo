package expo.modules.updates.procedures

import android.app.Activity
import android.content.Context
import com.facebook.react.ReactApplication
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.statemachine.UpdatesStateEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

class RecreateReactContextProcedure(
  private val context: Context,
  private val weakActivity: WeakReference<Activity>?,
  private val callback: Launcher.LauncherCallback,
  private val procedureScope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : StateMachineProcedure() {
  override val loggerTimerLabel = "timer-recreate-react-context"

  override suspend fun run(procedureContext: ProcedureContext) {
    val reactApplication = context.applicationContext as? ReactApplication ?: run inner@{
      callback.onFailure(Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."))
      return
    }

    procedureContext.processStateEvent(UpdatesStateEvent.Restart())
    callback.onSuccess()
    procedureScope.launch {
      withContext(Dispatchers.Main) {
        reactApplication.restart(weakActivity?.get(), "Restart from RecreateReactContextProcedure")
      }
    }
    procedureContext.resetStateAfterRestart()
    procedureContext.onComplete()
  }
}
