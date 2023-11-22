package expo.modules.updates.errorrecovery

import expo.modules.updates.UpdatesConfiguration

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

  suspend fun loadRemoteUpdate()
  suspend fun relaunch()
  fun throwException(exception: Exception)

  fun markFailedLaunchForLaunchedUpdate()
  fun markSuccessfulLaunchForLaunchedUpdate()

  fun getRemoteLoadStatus(): RemoteLoadStatus
  fun getCheckAutomaticallyConfiguration(): UpdatesConfiguration.CheckAutomaticallyConfiguration
  fun getLaunchedUpdateSuccessfulLaunchCount(): Int
}
