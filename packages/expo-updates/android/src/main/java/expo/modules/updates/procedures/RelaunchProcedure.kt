package expo.modules.updates.procedures

import android.app.Activity
import android.content.Context
import android.os.AsyncTask
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.config.ReactFeatureFlags
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateEvent
import java.io.File
import java.lang.ref.WeakReference

class RelaunchProcedure(
  private val context: Context,
  private val weakActivity: WeakReference<Activity>?,
  private val updatesConfiguration: UpdatesConfiguration,
  private val logger: UpdatesLogger,
  private val databaseHolder: DatabaseHolder,
  private val updatesDirectory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val getCurrentLauncher: () -> Launcher,
  private val setCurrentLauncher: (launcher: Launcher) -> Unit,
  private val shouldRunReaper: Boolean,
  private val callback: Launcher.LauncherCallback
) : StateMachineProcedure() {
  override val loggerTimerLabel = "timer-relaunch"

  override fun run(procedureContext: ProcedureContext) {
    val reactApplication = context as? ReactApplication ?: run inner@{
      callback.onFailure(Exception("Could not reload application. Ensure you have passed the correct instance of ReactApplication into UpdatesController.initialize()."))
      return
    }

    procedureContext.processStateEvent(UpdatesStateEvent.Restart())

    val oldLaunchAssetFile = getCurrentLauncher().launchAssetFile

    val newLauncher = DatabaseLauncher(
      context,
      updatesConfiguration,
      updatesDirectory,
      fileDownloader,
      selectionPolicy,
      logger
    )
    newLauncher.launch(
      databaseHolder.database,
      object : Launcher.LauncherCallback {
        override fun onFailure(e: Exception) {
          callback.onFailure(e)
          procedureContext.onComplete()
        }

        override fun onSuccess() {
          setCurrentLauncher(newLauncher)
          databaseHolder.releaseDatabase()

          val newLaunchAssetFile = getCurrentLauncher().launchAssetFile
          if (newLaunchAssetFile != null && newLaunchAssetFile != oldLaunchAssetFile) {
            try {
              replaceLaunchAssetFileIfNeeded(reactApplication, newLaunchAssetFile)
            } catch (e: Exception) {
              logger.error("Could not reset launchAssetFile for the ReactApplication", e, UpdatesErrorCode.Unknown)
            }
          }
          callback.onSuccess()
          Handler(Looper.getMainLooper()).post {
            reactApplication.restart(weakActivity?.get(), "Restart from RelaunchProcedure")
          }
          if (shouldRunReaper) {
            runReaper()
          }
          procedureContext.resetState()
          procedureContext.onComplete()
        }
      }
    )
  }

  private fun runReaper() {
    AsyncTask.execute {
      Reaper.reapUnusedUpdates(
        updatesConfiguration,
        databaseHolder.database,
        updatesDirectory,
        getCurrentLauncher().launchedUpdate,
        selectionPolicy
      )
      databaseHolder.releaseDatabase()
    }
  }

  /**
   * For bridgeless mode, the restarting will pull the new [JSBundleLoader]
   * based on the new [DatabaseLauncher] through the [ReactNativeHostHandler].
   * So this method is a no-op for bridgeless mode.
   *
   * For bridge mode unfortunately, even though RN exposes a way to reload an application,
   * it assumes that the JS bundle will stay at the same location throughout
   * the entire lifecycle of the app. To change the location of the bundle,
   * we need to use reflection to set an inaccessible field in the
   * [com.facebook.react.ReactInstanceManager].
   */
  private fun replaceLaunchAssetFileIfNeeded(
    reactApplication: ReactApplication,
    launchAssetFile: String
  ) {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      return
    }

    val instanceManager = reactApplication.reactNativeHost.reactInstanceManager
    val jsBundleLoaderField = instanceManager.javaClass.getDeclaredField("mBundleLoader")
    jsBundleLoaderField.isAccessible = true
    jsBundleLoaderField[instanceManager] = JSBundleLoader.createFileLoader(launchAssetFile)
  }

  companion object {
    private val TAG = RelaunchProcedure::class.java.simpleName
  }
}
