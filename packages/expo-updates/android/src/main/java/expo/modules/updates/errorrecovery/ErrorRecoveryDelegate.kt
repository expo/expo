package expo.modules.updates.errorrecovery

import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.launcher.Launcher

/**
 * Interface for a delegate that will execute the actions prescribed by the error recovery
 * pipeline. Implemented by [UpdatesController].
 */
interface ErrorRecoveryDelegate {

  enum class RemoteLoadStatus {
    IDLE,
    NEW_UPDATE_LOADING,
    NEW_UPDATE_LOADED
  }

  fun loadRemoteUpdate()
  fun relaunch(callback: Launcher.LauncherCallback)
  fun throwException(exception: Exception)

  fun markFailedLaunchForLaunchedUpdate()
  fun markSuccessfulLaunchForLaunchedUpdate()

  fun getRemoteLoadStatus(): RemoteLoadStatus
  fun getCheckAutomaticallyConfiguration(): UpdatesConfiguration.CheckAutomaticallyConfiguration
  fun getLaunchedUpdateSuccessfulLaunchCount(): Int
}
