package expo.modules.updates.errorrecovery

import android.os.Handler
import android.os.Looper
import android.os.Message
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.launcher.Launcher
import java.lang.RuntimeException

internal class ErrorRecoveryHandler(
  looper: Looper,
  private val delegate: ErrorRecoveryDelegate
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
    when (val nextTask = pipeline.removeAt(0)) {
      Task.WAIT_FOR_REMOTE_UPDATE -> waitForRemoteUpdate()
      Task.LAUNCH_NEW_UPDATE -> tryRelaunchFromCache() // only called after a new update is downloaded and added to the cache, so the implementation is equivalent
      Task.LAUNCH_CACHED_UPDATE -> tryRelaunchFromCache()
      Task.CRASH -> crash()
      else -> throw RuntimeException("ErrorRecoveryHandler cannot perform task $nextTask")
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
    val remoteLoadStatus = delegate.getRemoteLoadStatus()
    if (remoteLoadStatus == ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADED) {
      runNextTask()
    } else if (remoteLoadStatus == ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING ||
      delegate.getCheckAutomaticallyConfiguration() != UpdatesConfiguration.CheckAutomaticallyConfiguration.NEVER
    ) {
      isWaitingForRemoteUpdate = true
      if (delegate.getRemoteLoadStatus() != ErrorRecoveryDelegate.RemoteLoadStatus.NEW_UPDATE_LOADING) {
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
