package expo.modules.updates.procedures

import android.content.Context
import android.os.AsyncTask
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.JSBundleLoader
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.LauncherResult
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.File
import java.lang.ref.WeakReference

class RelaunchProcedure(
  private val context: Context,
  private val updatesConfiguration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val updatesDirectory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val reactNativeHost: WeakReference<ReactNativeHost>?,
  private val getCurrentLauncherResult: () -> LauncherResult,
  private val setCurrentLauncherResult: (launcherResult: LauncherResult) -> Unit,
  private val shouldRunReaper: Boolean,
) : StateMachineProcedure<Unit>() {
  override suspend fun run(procedureContext: ProcedureContext) {
    val host = reactNativeHost?.get()
      ?: throw Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize().")

    procedureContext.processStateEvent(UpdatesStateEvent.Restart())

    val oldLaunchAssetFile = getCurrentLauncherResult().launchAssetFile

    val newLauncherResult = DatabaseLauncher(
      context,
      databaseHolder.database,
      updatesConfiguration,
      updatesDirectory,
      fileDownloader,
      selectionPolicy
    ).launch()

    setCurrentLauncherResult(newLauncherResult)
    databaseHolder.releaseDatabase()

    val instanceManager = host.reactInstanceManager

    val newLaunchAssetFile = newLauncherResult.launchAssetFile
    if (newLaunchAssetFile != null && newLaunchAssetFile != oldLaunchAssetFile) {
      // Unfortunately, even though RN exposes a way to reload an application,
      // it assumes that the JS bundle will stay at the same location throughout
      // the entire lifecycle of the app. Since we need to change the location of
      // the bundle, we need to use reflection to set an otherwise inaccessible
      // field of the ReactInstanceManager.
      try {
        val newJSBundleLoader = JSBundleLoader.createFileLoader(newLaunchAssetFile)
        val jsBundleLoaderField = instanceManager.javaClass.getDeclaredField("mBundleLoader")
        jsBundleLoaderField.isAccessible = true
        jsBundleLoaderField[instanceManager] = newJSBundleLoader
      } catch (e: Exception) {
        Log.e(TAG, "Could not reset JSBundleLoader in ReactInstanceManager", e)
      }
    }
    val handler = Handler(Looper.getMainLooper())
    handler.post { instanceManager.recreateReactContextInBackground() }
    if (shouldRunReaper) {
      runReaper()
    }
    procedureContext.resetState()
  }

  private fun runReaper() {
    @OptIn(DelicateCoroutinesApi::class)
    GlobalScope.launch {
      Reaper.reapUnusedUpdates(
        updatesConfiguration,
        databaseHolder.database,
        updatesDirectory,
        getCurrentLauncherResult().launchedUpdate,
        selectionPolicy
      )
      databaseHolder.releaseDatabase()
    }
  }

  companion object {
    private val TAG = RelaunchProcedure::class.java.simpleName
  }
}
