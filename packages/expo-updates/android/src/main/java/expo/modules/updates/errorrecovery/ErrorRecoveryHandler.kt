package expo.modules.updates.errorrecovery

import android.os.Handler
import android.os.Looper
import android.os.Message
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.launcher.Launcher
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import java.lang.RuntimeException

/**
 * Keeps track of and executes tasks in the error recovery pipeline. The pipeline allows us to
 * predictably and serially respond to unpredictably ordered events.
 *
 * This error recovery flow is intended to be lightweight and is *not* a full safety net whose
 * purpose is to avoid crashes at all costs. Rather, its primary purpose is to prevent bad updates
 * from "bricking" an app by causing crashes before there is ever a chance to download a fix.
 *
 * When an error is caught, the pipeline is started and executes the following tasks serially:
 * (a) check for a new update and start downloading if there is one
 * (b) if there is a new update, reload and launch the new update
 * (c) if not, or if another error occurs, fall back to an older working update (if one exists)
 * (d) crash.
 *
 * Importantly, (b) and (c) will be taken out of the pipeline as soon as the first root view render
 * occurs. If any update modifies persistent state in a non-backwards-compatible way, it isn't
 * safe to automatically roll back; we use the first root view render as a rough proxy for this
 * (assuming it's unlikely an app will make significant modifications to persisted state before its
 * initial render).
 *
 * This pipeline will not be triggered at all for errors caught more than 10 seconds after content
 * has appeared; it is assumed that by this point, expo-updates will have had enough time to
 * download a new update if there is one, and so there is no more need to intervene.
 *
 * This behavior is documented in more detail at https://docs.expo.dev/bare/error-recovery/.
 */
internal class ErrorRecoveryHandler(
  looper: Looper,
  private val delegate: ErrorRecoveryDelegate,
  private val logger: UpdatesLogger
) : Handler(looper) {
  private val pipeline = arrayListOf(
    Task.WAIT_FOR_REMOTE_UPDATE,
    Task.LAUNCH_NEW_UPDATE,
    Task.LAUNCH_CACHED_UPDATE,
    Task.CRASH
  )
  private var isPipelineRunning = false
  private var isWaitingForRemoteUpdate = false
  private var hasContentAppeared = false
  private val encounteredErrors = ArrayList<Exception>()

  object MessageType {
    const val EXCEPTION_ENCOUNTERED = 0
    const val CONTENT_APPEARED = 1
    const val REMOTE_LOAD_STATUS_CHANGED = 2
  }

  private enum class Task {
    WAIT_FOR_REMOTE_UPDATE,
    LAUNCH_NEW_UPDATE,
    LAUNCH_CACHED_UPDATE,
    CRASH
  }

  override fun handleMessage(msg: Message) {
    when (msg.what) {
      MessageType.EXCEPTION_ENCOUNTERED -> maybeStartPipeline(msg.obj as Exception)
      MessageType.CONTENT_APPEARED -> handleContentAppeared()
      MessageType.REMOTE_LOAD_STATUS_CHANGED -> handleRemoteLoadStatusChanged(msg.obj as ErrorRecoveryDelegate.RemoteLoadStatus)
      else -> throw RuntimeException("ErrorRecoveryHandler cannot handle message " + msg.what)
    }
  }

  private fun handleContentAppeared() {
    hasContentAppeared = true
    // the launch now counts as "successful" so we don't want to roll back;
    // remove any extraneous tasks from the pipeline as such
    pipeline.retainAll(setOf(Task.WAIT_FOR_REMOTE_UPDATE, Task.CRASH))
    delegate.markSuccessfulLaunchForLaunchedUpdate()
  }

  private fun handleRemoteLoadStatusChanged(newStatus: ErrorRecoveryDelegate.RemoteLoadStatus) {
    if (!isWaitingForRemoteUpdate) {
      return
    }
    isWaitingForRemoteUpdate = false
    if (newStatus != ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED) {
      pipeline.remove(Task.LAUNCH_NEW_UPDATE)
    }
    runNextTask()
  }

  private fun runNextTask() {
    when (pipeline.removeAt(0)) {
      Task.WAIT_FOR_REMOTE_UPDATE -> {
        logger.info("UpdatesErrorRecovery: attempting to fetch a new update, waiting")
        waitForRemoteUpdate()
      }
      Task.LAUNCH_NEW_UPDATE -> {
        logger.info("UpdatesErrorRecovery: launching new update")
        tryRelaunchFromCache()
      } // only called after a new update is downloaded and added to the cache, so the implementation is equivalent
      Task.LAUNCH_CACHED_UPDATE -> {
        logger.info("UpdatesErrorRecovery: falling back to older update")
        tryRelaunchFromCache()
      }
      Task.CRASH -> {
        logger.error("UpdatesErrorRecovery: could not recover from error, crashing", UpdatesErrorCode.Unknown)
        crash()
      }
    }
  }

  private fun maybeStartPipeline(exception: Exception) {
    encounteredErrors.add(exception)
    if (delegate.getLaunchedUpdateSuccessfulLaunchCount() > 0) {
      pipeline.remove(Task.LAUNCH_CACHED_UPDATE)
    } else if (!hasContentAppeared) {
      delegate.markFailedLaunchForLaunchedUpdate()
    }

    if (!isPipelineRunning) {
      isPipelineRunning = true
      runNextTask()
    }
  }

  private fun waitForRemoteUpdate() {
    // we don't want to start a new download if there is already one in progress (or one has just
    // finished) so we check the delegate's status first
    val remoteLoadStatus = delegate.getRemoteLoadStatus()
    if (remoteLoadStatus == ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED) {
      // A new update has finished downloading in the time since the bad update launched. Proceed
      // to the next task (launching the new update)
      runNextTask()
    } else if (remoteLoadStatus == ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING ||
      delegate.getCheckAutomaticallyConfiguration() != UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER
    ) {
      // There is already a download in progress OR the build is configured to only check for
      // updates when recovering from an error => we need to start a download now
      isWaitingForRemoteUpdate = true
      if (delegate.getRemoteLoadStatus() != ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING) {
        // Start a download; the delegate will push a new message to the handler when the download
        // has finished
        delegate.loadRemoteUpdate()
      }
      postDelayed({ handleRemoteLoadStatusChanged(ErrorRecoveryDelegate.RemoteLoadStatus.IDLE) }, REMOTE_LOAD_TIMEOUT_MS)
    } else {
      // there's no remote update, so move to the next step in the pipeline
      pipeline.remove(Task.LAUNCH_NEW_UPDATE)
      runNextTask()
    }
  }

  private fun tryRelaunchFromCache() {
    delegate.relaunch(object : Launcher.LauncherCallback {
      override fun onFailure(e: Exception) {
        // post to our looper, in case we're on a different thread now
        post {
          encounteredErrors.add(e)
          pipeline.removeAll(setOf(Task.LAUNCH_NEW_UPDATE, Task.LAUNCH_CACHED_UPDATE))
          runNextTask()
        }
      }

      override fun onSuccess() {
        // post to our looper, in case we're on a different thread now
        post {
          isPipelineRunning = false
        }
      }
    })
  }

  private fun crash() {
    // throw the initial exception to preserve its stacktrace
    // rather than creating a new (aggregate) one
    delegate.throwException(encounteredErrors[0])
  }

  companion object {
    const val REMOTE_LOAD_TIMEOUT_MS = 5000L
  }
}
