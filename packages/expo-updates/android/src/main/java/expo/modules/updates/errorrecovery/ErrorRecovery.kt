package expo.modules.updates.errorrecovery

import android.os.Handler
import android.os.HandlerThread
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarker.MarkerListener
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger

/**
 * Entry point for the error recovery flow. Responsible for initializing the error recovery handler
 * and handler thread, and for registering (and unregistering) listeners to lifecycle events so that
 * the appropriate error recovery flows will be triggered.
 *
 * The error recovery flow is intended to be lightweight and is *not* a full safety net whose
 * purpose is to avoid crashes at all costs. Rather, its primary purpose is to prevent bad updates
 * from "bricking" an app by causing crashes before there is ever a chance to download a fix.
 *
 * Notably, the error listener will be unregistered 10 seconds after content has appeared; we assume
 * that by this point, expo-updates has had enough time to download a new update if there is one,
 * and so there is no more need to trigger the error recovery pipeline.
 */
class ErrorRecovery(
  private val logger: UpdatesLogger
) {
  internal val handlerThread = HandlerThread("expo-updates-error-recovery")
  internal lateinit var handler: Handler

  private var shouldHandleReactInstanceException = false

  fun initialize(delegate: ErrorRecoveryDelegate) {
    if (!::handler.isInitialized) {
      handlerThread.start()
      handler = ErrorRecoveryHandler(handlerThread.looper, delegate, logger)
    }
  }

  fun startMonitoring(devSupportManager: DevSupportManager) {
    registerContentAppearedListener()
    registerErrorHandler(devSupportManager)
  }

  /**
   * Exception notifications sending from [expo.modules.core.interfaces.ReactNativeHostHandler]
   * This is only used for bridgeless mode.
   */
  internal fun onReactInstanceException(exception: Exception) {
    if (shouldHandleReactInstanceException) {
      handleException(exception)
    }
  }

  fun notifyNewRemoteLoadStatus(newStatus: ErrorRecoveryDelegate.RemoteLoadStatus) {
    logger.info("ErrorRecovery: remote load status changed: $newStatus")
    handler.sendMessage(handler.obtainMessage(ErrorRecoveryHandler.MessageType.REMOTE_LOAD_STATUS_CHANGED, newStatus))
  }

  internal fun handleException(exception: Exception) {
    logger.error("ErrorRecovery: exception encountered: ${exception.localizedMessage}", exception, UpdatesErrorCode.Unknown)
    handler.sendMessage(handler.obtainMessage(ErrorRecoveryHandler.MessageType.EXCEPTION_ENCOUNTERED, exception))
  }

  internal fun handleContentAppeared() {
    handler.sendMessage(handler.obtainMessage(ErrorRecoveryHandler.MessageType.CONTENT_APPEARED))

    unregisterContentAppearedListener()

    // wait 10s before unsetting error handlers; even though we won't try to relaunch if our
    // handlers are triggered after now, we still want to give the app a reasonable window of time
    // to start the WAIT_FOR_REMOTE_UPDATE task and check for a new update is there is one
    //
    // it's safe to use the handler thread for this since nothing else
    // touches this class's fields
    handler.postDelayed({ unregisterErrorHandler() }, 10000)
  }

  private val contentAppearedListener = MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      handleContentAppeared()
    }
  }

  private fun registerContentAppearedListener() {
    ReactMarker.addListener(contentAppearedListener)
  }

  private fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }

  private fun registerErrorHandler(devSupportManager: DevSupportManager) {
    shouldHandleReactInstanceException = true
  }

  private fun unregisterErrorHandler() {
    shouldHandleReactInstanceException = false
  }
}
