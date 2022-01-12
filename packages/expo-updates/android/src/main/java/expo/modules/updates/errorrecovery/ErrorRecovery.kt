package expo.modules.updates.errorrecovery

import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.DefaultNativeModuleCallExceptionHandler
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.devsupport.DisabledDevSupportManager
import java.lang.ref.WeakReference
import kotlin.Exception

class ErrorRecovery {
  internal val handlerThread = HandlerThread("expo-updates-error-recovery")
  internal lateinit var handler: Handler

  private var weakReactInstanceManager: WeakReference<ReactInstanceManager>? = null
  private var previousExceptionHandler: DefaultNativeModuleCallExceptionHandler? = null

  fun initialize(delegate: ErrorRecoveryDelegate) {
    if (!::handler.isInitialized) {
      handlerThread.start()
      handler = ErrorRecoveryHandler(handlerThread.looper, delegate)
    }
  }

  fun startMonitoring(reactInstanceManager: ReactInstanceManager) {
    registerContentAppearedListener()
    registerErrorHandler(reactInstanceManager)
  }

  fun notifyNewRemoteLoadStatus(newStatus: ErrorRecoveryDelegate.RemoteLoadStatus) {
    handler.sendMessage(handler.obtainMessage(ErrorRecoveryHandler.MessageType.REMOTE_LOAD_STATUS_CHANGED, newStatus))
  }

  internal fun handleException(exception: Exception) {
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
    val defaultNativeModuleCallExceptionHandler = object : DefaultNativeModuleCallExceptionHandler() {
      override fun handleException(e: Exception?) {
        this@ErrorRecovery.handleException(e!!)
      }
    }
    val devSupportManagerClass = devSupportManager.javaClass
    previousExceptionHandler = devSupportManagerClass.getDeclaredField("mDefaultNativeModuleCallExceptionHandler").let { field ->
      field.isAccessible = true
      val previousValue = field[devSupportManager]
      field[devSupportManager] = defaultNativeModuleCallExceptionHandler
      return@let previousValue as DefaultNativeModuleCallExceptionHandler
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
      devSupportManagerClass.getDeclaredField("mDefaultNativeModuleCallExceptionHandler").let { field ->
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
