package expo.modules.updates.errorrecovery

import android.content.Context
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.DefaultJSExceptionHandler
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.devsupport.DisabledDevSupportManager
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import java.lang.ref.WeakReference
import kotlin.Exception

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
  private val context: Context
) {
  internal val handlerThread = HandlerThread("expo-updates-error-recovery")
  internal lateinit var handler: Handler
  internal val logger = UpdatesLogger(context)

  private var weakReactInstanceManager: WeakReference<ReactInstanceManager>? = null
  private var previousExceptionHandler: DefaultJSExceptionHandler? = null

  fun initialize(delegate: ErrorRecoveryDelegate) {
    if (!::handler.isInitialized) {
      handlerThread.start()
      handler = ErrorRecoveryHandler(handlerThread.looper, delegate, logger)
    }
  }

  fun startMonitoring(reactInstanceManager: ReactInstanceManager) {
    registerContentAppearedListener()
    registerErrorHandler(reactInstanceManager)
  }

  fun notifyNewRemoteLoadStatus(newStatus: ErrorRecoveryDelegate.RemoteLoadStatus) {
    logger.info("ErrorRecovery: remote load status changed: $newStatus")
    handler.sendMessage(handler.obtainMessage(ErrorRecoveryHandler.MessageType.REMOTE_LOAD_STATUS_CHANGED, newStatus))
  }

  internal fun handleException(exception: Exception) {
    logger.error("ErrorRecovery: exception encountered: ${exception.localizedMessage}", UpdatesErrorCode.Unknown, exception)
    handler.sendMessage(handler.obtainMessage(ErrorRecoveryHandler.MessageType.EXCEPTION_ENCOUNTERED, exception))
  }

  internal fun handleContentAppeared() {
    handler.sendMessage(handler.obtainMessage(ErrorRecoveryHandler.MessageType.CONTENT_APPEARED))
    // wait 10s before unsetting error handlers; even though we won't try to relaunch if our
    // handlers are triggered after now, we still want to give the app a reasonable window of time
    // to start the WAIT_FOR_REMOTE_UPDATE task and check for a new update is there is one
    //
    // it's safe to use the handler thread for this since nothing else
    // touches this class's fields
    handler.postDelayed({ unregisterErrorHandler() }, 10000)
  }

  private fun registerContentAppearedListener() {
    ReactMarker.addListener { name, _, _ ->
      if (name == ReactMarkerConstants.CONTENT_APPEARED) {
        handleContentAppeared()
      }
    }
  }

  private fun registerErrorHandler(reactInstanceManager: ReactInstanceManager) {
    if (reactInstanceManager.devSupportManager !is DisabledDevSupportManager) {
      Log.d(TAG, "Unexpected type of ReactInstanceManager.DevSupportManager. expo-updates error recovery will not behave properly.")
      return
    }

    val devSupportManager = reactInstanceManager.devSupportManager as DisabledDevSupportManager
    val defaultJSExceptionHandler = object : DefaultJSExceptionHandler() {
      override fun handleException(e: Exception?) {
        this@ErrorRecovery.handleException(e!!)
      }
    }
    val devSupportManagerClass = devSupportManager.javaClass
    previousExceptionHandler = devSupportManagerClass.getDeclaredField("mDefaultJSExceptionHandler").let { field ->
      field.isAccessible = true
      val previousValue = field[devSupportManager]
      field[devSupportManager] = defaultJSExceptionHandler
      return@let previousValue as DefaultJSExceptionHandler
    }
    weakReactInstanceManager = WeakReference(reactInstanceManager)
  }

  private fun unregisterErrorHandler() {
    weakReactInstanceManager?.get()?.let { reactInstanceManager ->
      if (reactInstanceManager.devSupportManager !is DisabledDevSupportManager) {
        Log.d(TAG, "Unexpected type of ReactInstanceManager.DevSupportManager. expo-updates could not unregister its error handler")
        return
      }
      if (previousExceptionHandler == null) {
        return
      }

      val devSupportManager = reactInstanceManager.devSupportManager as DisabledDevSupportManager
      val devSupportManagerClass = devSupportManager.javaClass
      devSupportManagerClass.getDeclaredField("mDefaultJSExceptionHandler").let { field ->
        field.isAccessible = true
        field[devSupportManager] = previousExceptionHandler
      }
      weakReactInstanceManager = null
    }
    // quitSafely will wait for processing messages to finish but cancel all messages scheduled for
    // a future time, so delay for a few more seconds in case there are any scheduled messages
    handler.postDelayed({ handlerThread.quitSafely() }, 10000)
  }

  companion object {
    private val TAG = ErrorRecovery::class.java.simpleName
  }
}
