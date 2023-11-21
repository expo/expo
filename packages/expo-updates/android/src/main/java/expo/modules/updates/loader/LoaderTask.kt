package expo.modules.updates.loader

import android.content.Context
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.LauncherResult
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.SelectionPolicy
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.cancel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.selects.select
import org.json.JSONObject
import java.io.File
import java.util.Date

data class LoaderTaskResult(val launcherResult: LauncherResult, val isUpToDate: Boolean)

class LoaderTask(
  private val context: Context,
  private val configuration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val directory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
) {
  enum class RemoteUpdateStatus {
    ERROR, NO_UPDATE_AVAILABLE, UPDATE_AVAILABLE
  }

  enum class RemoteCheckResultNotAvailableReason(val value: String) {
    /**
     * No update manifest or rollback directive received from the update server.
     */
    NO_UPDATE_AVAILABLE_ON_SERVER("noUpdateAvailableOnServer"),
    /**
     * An update manifest was received from the update server, but the update is not launchable,
     * or does not pass the configured selection policy.
     */
    UPDATE_REJECTED_BY_SELECTION_POLICY("updateRejectedBySelectionPolicy"),
    /**
     * An update manifest was received from the update server, but the update has been previously
     * launched on this device and never successfully launched.
     */
    UPDATE_PREVIOUSLY_FAILED("updatePreviouslyFailed"),
    /**
     * A rollback directive was received from the update server, but the directive does not pass
     * the configured selection policy.
     */
    ROLLBACK_REJECTED_BY_SELECTION_POLICY("rollbackRejectedBySelectionPolicy"),
    /**
     * A rollback directive was received from the update server, but this app has no embedded update.
     */
    ROLLBACK_NO_EMBEDDED("rollbackNoEmbeddedConfiguration"),
  }

  sealed class RemoteCheckResult(private val status: Status) {
    private enum class Status {
      NO_UPDATE_AVAILABLE,
      UPDATE_AVAILABLE,
      ROLL_BACK_TO_EMBEDDED
    }

    class NoUpdateAvailable(val reason: RemoteCheckResultNotAvailableReason) : RemoteCheckResult(Status.NO_UPDATE_AVAILABLE)
    class UpdateAvailable(val manifest: JSONObject) : RemoteCheckResult(Status.UPDATE_AVAILABLE)
    class RollBackToEmbedded(val commitTime: Date) : RemoteCheckResult(Status.ROLL_BACK_TO_EMBEDDED)
  }

  interface LoaderTaskCallbacks {
    /**
     * This method is called after the loader task finishes doing all work. Note that it may have
     * "succeeded" before this with a loader, yet this method may still be called after the launch
     * to signal that all work is done (loading a remote update after the launch wait timeout has occurred).
     */
    fun onFinishedAllLoading()

    /**
     * This method gives the calling class a backdoor option to ignore the cached update and force
     * a remote load if it decides the cached update is not runnable. Returning false from this
     * callback will force a remote load, overriding the timeout and configuration settings for
     * whether or not to check for a remote update. Returning true from this callback will make
     * LoaderTask proceed as usual.
     */
    fun onCachedUpdateLoaded(update: UpdateEntity): Boolean

    fun onRemoteUpdateManifestResponseManifestLoaded(updateManifest: UpdateManifest)
    fun onRemoteCheckForUpdateStarted() {}
    fun onRemoteCheckForUpdateFinished(result: LoaderTask.RemoteCheckResult) {}
    fun onRemoteUpdateLoadStarted() {}
    fun onRemoteUpdateAssetLoaded(asset: AssetEntity, successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) {}
    fun onRemoteUpdateFinished(
      status: LoaderTask.RemoteUpdateStatus,
      update: UpdateEntity?,
      exception: Exception?
    )
  }

  suspend fun load(callbacks: LoaderTaskCallbacks): LoaderTaskResult {
    val shouldCheckForUpdate = UpdatesUtils.shouldCheckForUpdateOnLaunch(configuration, context)

    var candidateLauncherResult: LauncherResult? = null
    var timerExpired = false
    var ignoreTimer = false
    var isUpToDate = false

    val finalLauncherResult = coroutineScope {
      select {
        async {
          val fallbackLauncherResult = try {
            launchFallbackUpdateFromDisk()
          } catch (e: Exception) {
            // An unexpected failure has occurred here, or we are running in an environment with no
            // embedded update and we have no update downloaded (e.g. Expo client).
            // What to do in this case depends on whether or not we're trying to load a remote update.
            // If we are, then we should wait for the task to finish. If not, we need to fail here.
            if (!shouldCheckForUpdate) {
              callbacks.onFinishedAllLoading()
              throw e
            }
            null
          }

          candidateLauncherResult = fallbackLauncherResult

          if (timerExpired && candidateLauncherResult !== null) {
            // we still want to fetch the update when the timer has expired but only the cached
            // update has been loaded, but we want to do so in the background and it be a "fire and forget"
            @OptIn(DelicateCoroutinesApi::class)
            GlobalScope.launch {
              try {
                launchRemoteUpdate(null, true, callbacks)
                callbacks.onFinishedAllLoading()
              } catch (e: Exception) {
                // ignore errors in the "fire and forget" background load
                callbacks.onFinishedAllLoading()
              }
            }
            return@async candidateLauncherResult
          }

          val candidateLaunchedUpdate = candidateLauncherResult?.launchedUpdate
          if (candidateLaunchedUpdate !== null && !callbacks.onCachedUpdateLoaded(candidateLaunchedUpdate)) {
            // ignore timer and other settings and force launch a remote update
            ignoreTimer = true
            candidateLauncherResult = null

            val backgroundLauncherResult = try {
              launchRemoteUpdate(null, false, callbacks)
            } catch (e: Exception) {
              callbacks.onFinishedAllLoading()
              throw e
            }

            candidateLauncherResult = backgroundLauncherResult.launcherResult
            isUpToDate = backgroundLauncherResult.isUpToDate
            callbacks.onFinishedAllLoading()
            return@async candidateLauncherResult
          }

          if (shouldCheckForUpdate) {
            val backgroundLauncherResult = try {
              launchRemoteUpdate(candidateLauncherResult?.launchedUpdate, hasTaskAlreadyLaunched = timerExpired, callbacks)
            } catch (e: Exception) {
              callbacks.onFinishedAllLoading()
              throw e
            }

            candidateLauncherResult = backgroundLauncherResult.launcherResult
            isUpToDate = backgroundLauncherResult.isUpToDate
            callbacks.onFinishedAllLoading()
            return@async candidateLauncherResult
          }

          callbacks.onFinishedAllLoading()
          return@async candidateLauncherResult
        }.onAwait { it }

        if (configuration.launchWaitMs > 0) {
          async {
            delay(configuration.launchWaitMs.toLong())
            timerExpired = true

            if (candidateLauncherResult != null && !ignoreTimer) {
              return@async candidateLauncherResult
            } else {
              cancel() // TODO(wschurman) check this
              return@async null
            }
          }.onAwait { it }
        } else {
          timerExpired = true
        }
      }
    }

    runReaper(finalLauncherResult) // TODO(wschurman) background this somehow

    return LoaderTaskResult(
      launcherResult = finalLauncherResult ?: throw Exception("LoaderTask encountered an unexpected error and could not launch an update."),
      isUpToDate = isUpToDate
    )
  }

  private suspend fun launchFallbackUpdateFromDisk(): LauncherResult {
    val database = databaseHolder.database
    val launcher = DatabaseLauncher(context, database, configuration, directory, fileDownloader, selectionPolicy)

    if (!configuration.hasEmbeddedUpdate) {
      val launcherResult = launcher.launch()
      databaseHolder.releaseDatabase()
      return launcherResult
    }

    // if the embedded update should be launched (e.g. if it's newer than any other update we have
    // in the database, which can happen if the app binary is updated), load it into the database
    // so we can launch it
    val embeddedUpdate = EmbeddedManifest.get(context, configuration)!!.updateEntity
    val launchableUpdate = launcher.getLaunchableUpdate()
    val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
    if (!selectionPolicy.shouldLoadNewUpdate(embeddedUpdate, launchableUpdate, manifestFilters)) {
      val launcherResult = launcher.launch()
      databaseHolder.releaseDatabase()
      return launcherResult
    }

    try {
      EmbeddedLoader(context, configuration, database, directory).load(object :
          LoaderStatusCallbacks {
          override fun onAssetLoaded(
            asset: AssetEntity,
            successfulAssetCount: Int,
            failedAssetCount: Int,
            totalAssetCount: Int
          ) {
          }

          override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): OnUpdateResponseLoadedResult {
            return OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
          }
        })
      val launcherResult = launcher.launch()
      databaseHolder.releaseDatabase()
      return launcherResult
    } catch (e: Exception) {
      Log.e(TAG, "Unexpected error copying embedded update", e)
      val launcherResult = launcher.launch()
      databaseHolder.releaseDatabase()
      return launcherResult
    }
  }

  data class LaunchRemoteUpdateResult(val launcherResult: LauncherResult, val isUpToDate: Boolean)

  private suspend fun launchRemoteUpdate(candidateLaunchedUpdate: UpdateEntity?, hasTaskAlreadyLaunched: Boolean, callbacks: LoaderTaskCallbacks): LaunchRemoteUpdateResult {
    val database = databaseHolder.database
    callbacks.onRemoteCheckForUpdateStarted()

    var isUpToDate = false
    val loader = RemoteLoader(context, configuration, database, fileDownloader, directory, candidateLaunchedUpdate)
    val loaderResult = try {
      loader.load(object : LoaderStatusCallbacks {
        override fun onAssetLoaded(
          asset: AssetEntity,
          successfulAssetCount: Int,
          failedAssetCount: Int,
          totalAssetCount: Int
        ) {
          callbacks.onRemoteUpdateAssetLoaded(asset, successfulAssetCount, failedAssetCount, totalAssetCount)
        }

        override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): OnUpdateResponseLoadedResult {
          val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
          if (updateDirective != null) {
            return when (updateDirective) {
              is UpdateDirective.RollBackToEmbeddedUpdateDirective -> {
                isUpToDate = true
                callbacks.onRemoteCheckForUpdateFinished(LoaderTask.RemoteCheckResult.RollBackToEmbedded(updateDirective.commitTime))
                OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
              }
              is UpdateDirective.NoUpdateAvailableUpdateDirective -> {
                isUpToDate = true
                callbacks.onRemoteCheckForUpdateFinished(
                  LoaderTask.RemoteCheckResult.NoUpdateAvailable(
                    LoaderTask.RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER
                  )
                )
                OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
              }
            }
          }

          val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest
          if (updateManifest == null) {
            isUpToDate = true
            callbacks.onRemoteCheckForUpdateFinished(
              LoaderTask.RemoteCheckResult.NoUpdateAvailable(
                LoaderTask.RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER
              )
            )
            return OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
          }

          return if (selectionPolicy.shouldLoadNewUpdate(
              updateManifest.updateEntity,
              candidateLaunchedUpdate,
              updateResponse.responseHeaderData?.manifestFilters
            )
          ) {
            isUpToDate = false
            callbacks.onRemoteUpdateManifestResponseManifestLoaded(updateManifest)
            callbacks.onRemoteCheckForUpdateFinished(LoaderTask.RemoteCheckResult.UpdateAvailable(updateManifest.manifest.getRawJson()))
            callbacks.onRemoteUpdateLoadStarted()
            OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
          } else {
            isUpToDate = true
            callbacks.onRemoteCheckForUpdateFinished(
              LoaderTask.RemoteCheckResult.NoUpdateAvailable(
                LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_REJECTED_BY_SELECTION_POLICY
              )
            )
            OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
          }
        }
      })
    } catch (e: Exception) {
      databaseHolder.releaseDatabase()
      callbacks.onRemoteUpdateFinished(LoaderTask.RemoteUpdateStatus.ERROR, null, e)
      Log.e(TAG, "Failed to download remote update", e)
      throw e
    }

    val processedSuccessLoaderResultResult = RemoteLoader.processSuccessLoaderResult(
      context,
      configuration,
      database,
      selectionPolicy,
      directory,
      candidateLaunchedUpdate,
      loaderResult
    )

    val availableUpdate = processedSuccessLoaderResultResult.availableUpdate

    // a new update (or null update because onUpdateResponseLoaded returned false or it was just a directive) has loaded successfully;
    // we need to launch it with a new Launcher and replace the old Launcher so that the callback fires with the new one
    val newLauncher = DatabaseLauncher(context, database, configuration, directory, fileDownloader, selectionPolicy)
    val launcherResult = try {
      newLauncher.launch()
    } catch (e: Exception) {
      databaseHolder.releaseDatabase()
      Log.e(TAG, "Loaded new update but it failed to launch", e)
      throw e
    }

    databaseHolder.releaseDatabase()

    if (!hasTaskAlreadyLaunched) {
      isUpToDate = true
    }

    if (hasTaskAlreadyLaunched) {
      if (availableUpdate == null) {
        callbacks.onRemoteUpdateFinished(
          LoaderTask.RemoteUpdateStatus.NO_UPDATE_AVAILABLE,
          null,
          null
        )
      } else {
        callbacks.onRemoteUpdateFinished(
          LoaderTask.RemoteUpdateStatus.UPDATE_AVAILABLE,
          availableUpdate,
          null
        )
      }
    }

    return LaunchRemoteUpdateResult(launcherResult, isUpToDate)
  }

  private fun runReaper(finalLauncherResult: LauncherResult?) {
    if (finalLauncherResult == null) {
      return
    }

    val database = databaseHolder.database
    Reaper.reapUnusedUpdates(
      configuration,
      database,
      directory,
      finalLauncherResult.launchedUpdate,
      selectionPolicy
    )
    databaseHolder.releaseDatabase()
  }

  companion object {
    private val TAG = LoaderTask::class.java.simpleName
  }
}
