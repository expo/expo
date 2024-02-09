package expo.modules.updates.loader

import android.content.Context
import android.os.AsyncTask
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.Loader.LoaderCallback
import expo.modules.updates.manifest.EmbeddedManifestUtils
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.Update
import expo.modules.updates.selectionpolicy.SelectionPolicy
import org.json.JSONObject
import java.io.File
import java.util.Date

/**
 * Controlling class that handles the complex logic that needs to happen each time the app is cold
 * booted. From a high level, this class does the following:
 *
 * - Immediately starts an instance of [EmbeddedLoader] to load the embedded update into SQLite.
 *   This does nothing if SQLite already has the embedded update or a newer one, but we have to do
 *   this on each cold boot, as we have no way of knowing if a new build was just installed (which
 *   could have a new embedded update).
 * - If the app is configured for automatic update downloads (most apps), starts a timer based on
 *   the `launchWaitMs` value in [UpdatesConfiguration].
 * - Again if the app is configured for automatic update downloads, starts an instance of
 *   [RemoteLoader] to check for and download a new update if there is one.
 * - Once the download succeeds, fails, or the timer runs out (whichever happens first), creates an
 *   instance of [DatabaseLauncher] and signals that the app is ready to be launched with the newest
 *   update available locally at that time (which may not be the newest update if the download is
 *   still in progress).
 * - If the download succeeds or fails after this point, fires a callback which causes an event to
 *   be sent to JS.
 */
class LoaderTask(
  private val configuration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val directory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val callback: LoaderTaskCallback
) {
  enum class RemoteUpdateStatus {
    ERROR,
    NO_UPDATE_AVAILABLE,
    UPDATE_AVAILABLE
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
    ROLLBACK_NO_EMBEDDED("rollbackNoEmbeddedConfiguration")
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

  interface LoaderTaskCallback {
    /**
     * Called when a failure has occurred during the load.
     */
    fun onFailure(e: Exception)

    /**
     * Called when the loader task finishes with a launcher. Note that this doesn't indicate that
     * the loader task is done running, it just may have reached the launch wait timeout and succeeded
     * with a fallback loader.
     */
    fun onSuccess(launcher: Launcher, isUpToDate: Boolean)

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

    fun onRemoteUpdateManifestResponseUpdateLoaded(update: Update)
    fun onRemoteCheckForUpdateStarted() {}
    fun onRemoteCheckForUpdateFinished(result: RemoteCheckResult) {}
    fun onRemoteUpdateLoadStarted() {}
    fun onRemoteUpdateAssetLoaded(asset: AssetEntity, successfulAssetCount: Int, failedAssetCount: Int, totalAssetCount: Int) {}
    fun onRemoteUpdateFinished(
      status: RemoteUpdateStatus,
      update: UpdateEntity?,
      exception: Exception?
    )
  }

  private interface LaunchUpdateCallback {
    fun onFailure(e: Exception)
    fun onSuccess()
  }

  var isRunning = false
    private set

  // success conditions
  private var isReadyToLaunch = false
  private var timeoutFinished = false
  private var hasLaunched = false
  private var isUpToDate = false
  private val handlerThread: HandlerThread = HandlerThread("expo-updates-timer")
  private var candidateLauncher: Launcher? = null
  private var finalizedLauncher: Launcher? = null

  fun start(context: Context) {
    isRunning = true

    val shouldCheckForUpdate = UpdatesUtils.shouldCheckForUpdateOnLaunch(configuration, context)
    val delay = configuration.launchWaitMs
    if (delay > 0 && shouldCheckForUpdate) {
      handlerThread.start()
      Handler(handlerThread.looper).postDelayed({ timeout() }, delay.toLong())
    } else {
      timeoutFinished = true
    }

    launchFallbackUpdateFromDisk(
      context,
      object : LaunchUpdateCallback {
        private fun launchRemoteUpdate() {
          launchRemoteUpdateInBackground(
            context,
            object : LaunchUpdateCallback {
              override fun onFailure(e: Exception) {
                finish(e)
                isRunning = false
                runReaper()
                callback.onFinishedAllLoading()
              }

              override fun onSuccess() {
                synchronized(this@LoaderTask) { isReadyToLaunch = true }
                finish(null)
                isRunning = false
                runReaper()
                callback.onFinishedAllLoading()
              }
            }
          )
        }

        override fun onFailure(e: Exception) {
          // An unexpected failure has occurred here, or we are running in an environment with no
          // embedded update and we have no update downloaded (e.g. Expo client).
          // What to do in this case depends on whether or not we're trying to load a remote update.
          // If we are, then we should wait for the task to finish. If not, we need to fail here.
          if (!shouldCheckForUpdate) {
            finish(e)
            isRunning = false
            callback.onFinishedAllLoading()
          } else {
            launchRemoteUpdate()
          }
          Log.e(TAG, "Failed to launch embedded or launchable update", e)
        }

        override fun onSuccess() {
          if (candidateLauncher!!.launchedUpdate != null &&
            !callback.onCachedUpdateLoaded(candidateLauncher!!.launchedUpdate!!)
          ) {
            // ignore timer and other settings and force launch a remote update
            stopTimer()
            candidateLauncher = null
            launchRemoteUpdate()
          } else {
            synchronized(this@LoaderTask) {
              isReadyToLaunch = true
              maybeFinish()
            }
            if (shouldCheckForUpdate) {
              launchRemoteUpdate()
            } else {
              isRunning = false
              runReaper()
              callback.onFinishedAllLoading()
            }
          }
        }
      }
    )
  }

  /**
   * This method should be called at the end of the LoaderTask. Whether or not the task has
   * successfully loaded an update to launch, the timer will stop and the appropriate callback
   * function will be fired.
   */
  @Synchronized
  private fun finish(e: Exception?) {
    if (hasLaunched) {
      // we've already fired once, don't do it again
      return
    }
    hasLaunched = true
    finalizedLauncher = candidateLauncher
    if (!isReadyToLaunch || finalizedLauncher == null || finalizedLauncher!!.launchedUpdate == null) {
      callback.onFailure(
        e
          ?: Exception("LoaderTask encountered an unexpected error and could not launch an update.")
      )
    } else {
      callback.onSuccess(finalizedLauncher!!, isUpToDate)
    }
    if (!timeoutFinished) {
      stopTimer()
    }
    if (e != null) {
      Log.e(TAG, "Unexpected error encountered while loading this app", e)
    }
  }

  /**
   * This method should be called to conditionally fire the callback. If the task has successfully
   * loaded an update to launch and the timer isn't still running, the appropriate callback function
   * will be fired. If not, no callback will be fired.
   */
  @Synchronized
  private fun maybeFinish() {
    if (!isReadyToLaunch || !timeoutFinished) {
      // too early, bail out
      return
    }
    finish(null)
  }

  @Synchronized
  private fun stopTimer() {
    timeoutFinished = true
    handlerThread.quitSafely()
  }

  @Synchronized
  private fun timeout() {
    if (!timeoutFinished) {
      timeoutFinished = true
      maybeFinish()
    }
    stopTimer()
  }

  private fun launchFallbackUpdateFromDisk(context: Context, diskUpdateCallback: LaunchUpdateCallback) {
    val database = databaseHolder.database
    val launcher = DatabaseLauncher(configuration, directory, fileDownloader, selectionPolicy)
    candidateLauncher = launcher
    val launcherCallback: LauncherCallback = object : LauncherCallback {
      override fun onFailure(e: Exception) {
        databaseHolder.releaseDatabase()
        diskUpdateCallback.onFailure(e)
      }

      override fun onSuccess() {
        databaseHolder.releaseDatabase()
        diskUpdateCallback.onSuccess()
      }
    }
    if (configuration.hasEmbeddedUpdate) {
      // if the embedded update should be launched (e.g. if it's newer than any other update we have
      // in the database, which can happen if the app binary is updated), load it into the database
      // so we can launch it
      val embeddedUpdate = EmbeddedManifestUtils.getEmbeddedUpdate(context, configuration)!!.updateEntity
      val launchableUpdate = launcher.getLaunchableUpdate(database, context)
      val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
      if (selectionPolicy.shouldLoadNewUpdate(embeddedUpdate, launchableUpdate, manifestFilters)) {
        EmbeddedLoader(context, configuration, database, directory).start(object : LoaderCallback {
          override fun onFailure(e: Exception) {
            Log.e(TAG, "Unexpected error copying embedded update", e)
            launcher.launch(database, context, launcherCallback)
          }

          override fun onSuccess(loaderResult: Loader.LoaderResult) {
            launcher.launch(database, context, launcherCallback)
          }

          override fun onAssetLoaded(
            asset: AssetEntity,
            successfulAssetCount: Int,
            failedAssetCount: Int,
            totalAssetCount: Int
          ) {
            // do nothing
          }

          override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): Loader.OnUpdateResponseLoadedResult {
            return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
          }
        })
      } else {
        launcher.launch(database, context, launcherCallback)
      }
    } else {
      launcher.launch(database, context, launcherCallback)
    }
  }

  private fun launchRemoteUpdateInBackground(context: Context, remoteUpdateCallback: LaunchUpdateCallback) {
    AsyncTask.execute {
      val database = databaseHolder.database
      callback.onRemoteCheckForUpdateStarted()
      RemoteLoader(context, configuration, database, fileDownloader, directory, candidateLauncher?.launchedUpdate)
        .start(object : LoaderCallback {
          override fun onFailure(e: Exception) {
            databaseHolder.releaseDatabase()
            callback.onRemoteUpdateFinished(RemoteUpdateStatus.ERROR, null, e)
            Log.e(TAG, "Failed to download remote update", e)
            remoteUpdateCallback.onFailure(e)
          }

          override fun onAssetLoaded(
            asset: AssetEntity,
            successfulAssetCount: Int,
            failedAssetCount: Int,
            totalAssetCount: Int
          ) {
            callback.onRemoteUpdateAssetLoaded(asset, successfulAssetCount, failedAssetCount, totalAssetCount)
          }

          override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): Loader.OnUpdateResponseLoadedResult {
            val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
            if (updateDirective != null) {
              return when (updateDirective) {
                is UpdateDirective.RollBackToEmbeddedUpdateDirective -> {
                  isUpToDate = true
                  callback.onRemoteCheckForUpdateFinished(RemoteCheckResult.RollBackToEmbedded(updateDirective.commitTime))
                  Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
                }
                is UpdateDirective.NoUpdateAvailableUpdateDirective -> {
                  isUpToDate = true
                  callback.onRemoteCheckForUpdateFinished(RemoteCheckResult.NoUpdateAvailable(RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER))
                  Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
                }
              }
            }

            val update = updateResponse.manifestUpdateResponsePart?.update
            if (update == null) {
              isUpToDate = true
              callback.onRemoteCheckForUpdateFinished(RemoteCheckResult.NoUpdateAvailable(RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER))
              return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
            }

            return if (selectionPolicy.shouldLoadNewUpdate(
                update.updateEntity,
                candidateLauncher?.launchedUpdate,
                updateResponse.responseHeaderData?.manifestFilters
              )
            ) {
              isUpToDate = false
              callback.onRemoteUpdateManifestResponseUpdateLoaded(update)
              callback.onRemoteCheckForUpdateFinished(RemoteCheckResult.UpdateAvailable(update.manifest.getRawJson()))
              callback.onRemoteUpdateLoadStarted()
              Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
            } else {
              isUpToDate = true
              callback.onRemoteCheckForUpdateFinished(
                RemoteCheckResult.NoUpdateAvailable(
                  RemoteCheckResultNotAvailableReason.UPDATE_REJECTED_BY_SELECTION_POLICY
                )
              )
              Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
            }
          }

          override fun onSuccess(loaderResult: Loader.LoaderResult) {
            RemoteLoader.processSuccessLoaderResult(
              context,
              configuration,
              database,
              selectionPolicy,
              directory,
              candidateLauncher?.launchedUpdate,
              loaderResult
            ) { availableUpdate, _ ->
              launchUpdate(availableUpdate)
            }
          }

          private fun launchUpdate(availableUpdate: UpdateEntity?) {
            // a new update (or null update because onUpdateResponseLoaded returned false or it was just a directive) has loaded successfully;
            // we need to launch it with a new Launcher and replace the old Launcher so that the callback fires with the new one
            val newLauncher = DatabaseLauncher(configuration, directory, fileDownloader, selectionPolicy)
            newLauncher.launch(
              database,
              context,
              object : LauncherCallback {
                override fun onFailure(e: Exception) {
                  databaseHolder.releaseDatabase()
                  remoteUpdateCallback.onFailure(e)
                  Log.e(TAG, "Loaded new update but it failed to launch", e)
                }

                override fun onSuccess() {
                  databaseHolder.releaseDatabase()
                  val hasLaunchedSynchronized = synchronized(this@LoaderTask) {
                    if (!hasLaunched) {
                      candidateLauncher = newLauncher
                      isUpToDate = true
                    }
                    hasLaunched
                  }
                  if (hasLaunchedSynchronized) {
                    if (availableUpdate == null) {
                      callback.onRemoteUpdateFinished(
                        RemoteUpdateStatus.NO_UPDATE_AVAILABLE,
                        null,
                        null
                      )
                    } else {
                      callback.onRemoteUpdateFinished(
                        RemoteUpdateStatus.UPDATE_AVAILABLE,
                        availableUpdate,
                        null
                      )
                    }
                  }
                  remoteUpdateCallback.onSuccess()
                }
              }
            )
          }
        })
    }
  }

  private fun runReaper() {
    AsyncTask.execute {
      synchronized(this@LoaderTask) {
        val finalizedLaunchedUpdate = finalizedLauncher?.launchedUpdate
        if (finalizedLaunchedUpdate != null) {
          val database = databaseHolder.database
          Reaper.reapUnusedUpdates(
            configuration,
            database,
            directory,
            finalizedLaunchedUpdate,
            selectionPolicy
          )
          databaseHolder.releaseDatabase()
        }
      }
    }
  }

  companion object {
    private val TAG = LoaderTask::class.java.simpleName
  }
}
