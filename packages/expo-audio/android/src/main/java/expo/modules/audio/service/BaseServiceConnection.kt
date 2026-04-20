package expo.modules.audio.service

import android.app.Service
import android.content.ComponentName
import android.content.Context
import android.content.Context.BIND_AUTO_CREATE
import android.content.Context.BIND_INCLUDE_CAPABILITIES
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.util.Log
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

enum class ServiceBindingState {
  UNBOUND,
  BINDING,
  BOUND,
  UNBINDING,
  FAILED
}

abstract class BaseServiceConnection<T>(appContext: AppContext) : ServiceConnection {
  @Volatile
  private var _bindingState = ServiceBindingState.UNBOUND

  /**
   * Current binding state of the service connection.
   * This property is thread-safe and can be read from any thread.
   */
  var bindingState: ServiceBindingState
    get() = synchronized(this) {
      _bindingState
    }
    set(value) = synchronized(this) {
      _bindingState = value
    }

  val isConnected: Boolean
    get() = bindingState == ServiceBindingState.BOUND

  private val _appContext = WeakReference(appContext)
  protected val appContext: AppContext
    get() = _appContext.get() ?: throw Exceptions.AppContextLost()

  protected abstract fun onServiceConnectedInternal(binder: T)
  protected abstract fun getServiceErrorMessage(message: String): String

  protected open fun onBindingFailed(message: String, reason: Throwable? = null) {
    try {
      appContext.jsLogger?.error(getServiceErrorMessage(message), reason)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to log binding error: $message", e)
    }
  }

  protected open fun onServiceDied() {
    try {
      appContext.jsLogger?.error(
        getServiceErrorMessage("Service died unexpectedly")
      )
    } catch (e: Exception) {
      Log.e(TAG, "Failed to log service death", e)
    }
  }

  fun transitionToState(newState: ServiceBindingState) {
    bindingState = newState
  }

  override fun onServiceDisconnected(componentName: ComponentName) {
    bindingState = ServiceBindingState.UNBOUND

    onServiceDied()
  }

  override fun onBindingDied(name: ComponentName?) {
    bindingState = ServiceBindingState.UNBOUND

    onServiceDied()
    super.onBindingDied(name)
  }

  override fun onNullBinding(componentName: ComponentName) {
    bindingState = ServiceBindingState.FAILED

    val errorMessage = "Could not bind to the service. " +
      "Check AndroidManifest.xml for proper service and permission declarations."
    onBindingFailed(errorMessage)

    super.onNullBinding(componentName)
  }

  fun unbind() {
    val shouldUnbind =
      bindingState == ServiceBindingState.BOUND || bindingState == ServiceBindingState.BINDING

    if (shouldUnbind) {
      bindingState = ServiceBindingState.UNBINDING
      try {
        appContext.reactContext?.unbindService(this)
      } catch (e: IllegalArgumentException) {
        // Service was never bound or already unbound - this is expected in some cases
        Log.d(TAG, "Service was already unbound: ${e.message}")
      } catch (e: Exception) {
        appContext.jsLogger?.error("Unexpected error unbinding service: ${e.message}")
      } finally {
        bindingState = ServiceBindingState.UNBOUND
      }
    }
  }

  companion object {
    private const val TAG = "BaseServiceConnection"

    fun <T : Service> startServiceAndBind(
      appContext: AppContext,
      context: Context,
      serviceConnection: ServiceConnection,
      clazz: Class<T>,
      action: String
    ): Boolean {
      appContext.reactContext?.apply {
        val intent = Intent(context, clazz)
        intent.action = action

        startService(intent)

        val flags = if (Build.VERSION.SDK_INT >= 29) {
          BIND_AUTO_CREATE or BIND_INCLUDE_CAPABILITIES
        } else {
          BIND_AUTO_CREATE
        }

        return bindService(intent, serviceConnection, flags)
      }
      return false
    }
  }
}
