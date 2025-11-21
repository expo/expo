package expo.modules.updates.loader

import android.content.Context
import android.os.Handler
import android.os.HandlerThread
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.Reaper
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifestUtils
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.Update
import expo.modules.updates.selectionpolicy.SelectionPolicy
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
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
  private val context: Context,
  private val configuration: UpdatesConfiguration,
  private val databaseHolder: DatabaseHolder,
  private val directory: File,
  private val fileDownloader: FileDownloader,
  private val selectionPolicy: SelectionPolicy,
  private val logger: UpdatesLogger,
  private val callback: LoaderTaskCallback,
  private val scope: CoroutineScope
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

  suspend fun start() {
    isRunning = true

    val shouldCheckForUpdate = UpdatesUtils.shouldCheckForUpdateOnLaunch(configuration, logger, context)
    val delay = configuration.launchWaitMs
    if (delay > 0 && shouldCheckForUpdate) {
      handlerThread.start()
      Handler(handlerThread.looper).postDelayed({ timeout() }, delay.toLong())
    } else {
      timeoutFinished = true
    }

    try {
      launchFallbackUpdateFromDisk()
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
    } catch (e: Exception) {
      if (!shouldCheckForUpdate) {
        finish(e)
        isRunning = false
        callback.onFinishedAllLoading()
      } else {
        launchRemoteUpdate()
      }
      logger.error("Failed to launch embedded or launchable update", e, UpdatesErrorCode.UpdateFailedToLoad)
    }
  }

  private suspend fun launchRemoteUpdate() {
    try {
      launchRemoteUpdateInBackground()
      synchronized(this@LoaderTask) { isReadyToLaunch = true }
      finish(null)
      isRunning = false
      runReaper()
      callback.onFinishedAllLoading()
    } catch (e: Exception) {
      finish(e)
      isRunning = false
      runReaper()
      callback.onFinishedAllLoading()
    }
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
      logger.error("Unexpected error encountered while loading this app", e, UpdatesErrorCode.Unknown)
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

  private suspend fun launchFallbackUpdateFromDisk() {
    val database = databaseHolder.database
    val launcher =
      DatabaseLauncher(context, configuration, directory, fileDownloader, selectionPolicy, logger, scope)
    candidateLauncher = launcher

    if (configuration.hasEmbeddedUpdate) {
      // if the embedded update should be launched (e.g. if it's newer than any other update we have
      // in the database, which can happen if the app binary is updated), load it into the database
      // so we can launch it
      val embeddedUpdate =
        EmbeddedManifestUtils.getEmbeddedUpdate(context, configuration)!!.updateEntity
      val launchableUpdate = launcher.getLaunchableUpdate(database)
      val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
      if (selectionPolicy.shouldLoadNewUpdate(
          embeddedUpdate,
          launchableUpdate,
          manifestFilters
        )
      ) {
        try {
          val embeddedLoader = EmbeddedLoader(context, configuration, logger, database, directory)
          embeddedLoader.load { _ ->
            Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = true)
          }
        } catch (e: Exception) {
          logger.error("Unexpected error copying embedded update", e, UpdatesErrorCode.Unknown)
        }
        launcher.launch(database)
      } else {
        launcher.launch(database)
      }
    } else {
      launcher.launch(database)
    }
  }

  private suspend fun launchRemoteUpdateInBackground() {
    val database = databaseHolder.database
    callback.onRemoteCheckForUpdateStarted()
    val remoteLoader = RemoteLoader(context, configuration, logger, database, fileDownloader, directory, candidateLauncher?.launchedUpdate)

    // Set up progress flow collection in a separate coroutine
    val progressJob = scope.launch {
      remoteLoader.progressFlow.collect { progress ->
        callback.onRemoteUpdateAssetLoaded(progress.asset, progress.successfulAssetCount, progress.failedAssetCount, progress.totalAssetCount)
      }
    }

    try {
      val result = remoteLoader.load { updateResponse ->
        val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
        if (updateDirective != null) {
          return@load when (updateDirective) {
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
          return@load Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)
        }

        if (selectionPolicy.shouldLoadNewUpdate(
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

      val processResult = RemoteLoader.processSuccessLoaderResult(
        context,
        configuration,
        logger,
        database,
        selectionPolicy,
        directory,
        candidateLauncher?.launchedUpdate,
        result
      )

      val availableUpdate = processResult.availableUpdate
      val newLauncher = DatabaseLauncher(context, configuration, directory, fileDownloader, selectionPolicy, logger, scope)
      try {
        newLauncher.launch(database)
        synchronized(this@LoaderTask) {
          if (!hasLaunched) {
            candidateLauncher = newLauncher
            isUpToDate = true
          }
        }
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
      } catch (e: Exception) {
        callback.onRemoteUpdateFinished(
          RemoteUpdateStatus.ERROR,
          null,
          e
        )
        logger.error("Loaded new update but it failed to launch", e, UpdatesErrorCode.UpdateFailedToLoad)
        throw e
      }
    } catch (e: Exception) {
      // If we haven't already reported an error from the launcher, report the loader error
      if (e.message?.contains("Loaded new update but it failed to launch") != true) {
        callback.onRemoteUpdateFinished(RemoteUpdateStatus.ERROR, null, e)
        logger.error("Failed to download remote update", e, UpdatesErrorCode.UpdateFailedToLoad)
      }
      throw e
    } finally {
      progressJob.cancel()
    }
  }

  private fun runReaper() {
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
      }
    }
  }

  companion object {
    private val TAG = LoaderTask::class.java.simpleName
  }
}
