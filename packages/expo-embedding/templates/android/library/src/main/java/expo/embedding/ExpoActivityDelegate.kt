package expo.embedding

import android.content.Intent
import android.content.res.Configuration
import android.util.SparseArray
import androidx.activity.OnBackPressedCallback
import androidx.annotation.MainThread
import androidx.appcompat.app.AppCompatActivity
import androidx.core.util.Consumer
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class ExpoActivityDelegate {
  private var activity: AppCompatActivity? = null
  private var attachedHost: ExpoHost? = null
  private var destroyed = false
  private val permissionListeners = SparseArray<PermissionListener>()

  val host: ExpoHost
    get() = checkNotNull(attachedHost) {
      "Expo Activity is not attached. Call expo.attach(this, host) after super.onCreate() and before setContent()."
    }

  private fun requireActivity(): AppCompatActivity = checkNotNull(activity) {
    "Expo Activity is not attached. Call expo.attach(this, host) in onCreate() before forwarding callbacks."
  }

  private val backCallback = object : OnBackPressedCallback(true) {
    override fun handleOnBackPressed() {
      if (!host.reactHost.onBackPressed()) invokeNativeBack()
    }
  }
  private val intentListener = Consumer<Intent> { host.reactHost.onNewIntent(it) }
  private val configurationListener = Consumer<Configuration> {
    host.reactHost.onConfigurationChanged(requireActivity())
  }
  private val lifecycleObserver = object : DefaultLifecycleObserver {
    override fun onResume(owner: LifecycleOwner) {
      host.reactHost.onHostResume(requireActivity(), DefaultHardwareBackBtnHandler { invokeNativeBack() })
    }

    override fun onPause(owner: LifecycleOwner) {
      host.reactHost.onHostPause(requireActivity())
    }

    override fun onDestroy(owner: LifecycleOwner) {
      val activity = requireActivity()
      try {
        host.reactHost.onHostDestroy(activity)
      } finally {
        backCallback.remove()
        activity.removeOnNewIntentListener(intentListener)
        activity.removeOnConfigurationChangedListener(configurationListener)
        activity.lifecycle.removeObserver(this)
        activity.window.decorView.setTag(R.id.expo_embedding_activity_delegate, null)
        permissionListeners.clear()
        this@ExpoActivityDelegate.activity = null
        attachedHost = null
        destroyed = true
      }
    }
  }

  @MainThread
  fun attach(activity: AppCompatActivity, host: ExpoHost) {
    check(!destroyed) {
      "This Expo Activity delegate was destroyed. Create one delegate per Activity instance."
    }
    this.activity?.let { previous ->
      check(previous === activity && attachedHost === host) {
        "This Expo Activity delegate is already attached. Use the same Activity and host, or create a new delegate."
      }
      return
    }
    // ON_CREATE can arrive after the Activity's entire onCreate override returns.
    val state = activity.lifecycle.currentState
    check(activity.savedStateRegistry.isRestored &&
      (state == Lifecycle.State.INITIALIZED || state == Lifecycle.State.CREATED)) {
      "Expo Activity attached at the wrong lifecycle state. Call expo.attach(this, host) after super.onCreate() and before the Activity starts."
    }
    check(activity is PermissionAwareActivity) {
      "The Activity cannot forward native permission requests. Implement PermissionAwareActivity and forward its requestPermissions method to this delegate."
    }
    check(from(activity) == null) {
      "This Activity already has an Expo delegate. Attach only one delegate per Activity."
    }
    this.activity = activity
    attachedHost = host
    activity.window.decorView.setTag(R.id.expo_embedding_activity_delegate, this)
    activity.onBackPressedDispatcher.addCallback(activity, backCallback)
    activity.addOnNewIntentListener(intentListener)
    activity.addOnConfigurationChangedListener(configurationListener)
    activity.lifecycle.addObserver(lifecycleObserver)
  }

  private fun invokeNativeBack() {
    val activity = activity ?: return
    backCallback.isEnabled = false
    try {
      activity.onBackPressedDispatcher.onBackPressed()
    } finally {
      backCallback.isEnabled = true
    }
  }

  @MainThread
  fun onWindowFocusChanged(hasFocus: Boolean) {
    host.reactHost.onWindowFocusChange(hasFocus)
  }

  @MainThread
  fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    host.reactHost.onActivityResult(requireActivity(), requestCode, resultCode, data)
  }

  @MainThread
  fun requestPermissions(permissions: Array<String>, requestCode: Int, listener: PermissionListener?) {
    val activity = requireActivity()
    check(permissionListeners[requestCode] == null) {
      "A permission request with code $requestCode is already pending. Wait for its result or use a different request code."
    }
    if (listener != null) permissionListeners.put(requestCode, listener)
    try {
      activity.requestPermissions(permissions, requestCode)
    } catch (error: Exception) {
      permissionListeners.remove(requestCode)
      throw error
    }
  }

  @MainThread
  fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
    val listener = permissionListeners[requestCode] ?: return
    permissionListeners.remove(requestCode)
    if (!listener.onRequestPermissionsResult(requestCode, permissions, grantResults) && permissionListeners[requestCode] == null) {
      permissionListeners.put(requestCode, listener)
    }
  }

  internal companion object {
    fun from(activity: AppCompatActivity): ExpoActivityDelegate? =
      activity.window.decorView.getTag(R.id.expo_embedding_activity_delegate) as? ExpoActivityDelegate
  }
}
