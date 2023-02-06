package abi48_0_0.host.exp.exponent.modules.universal

import host.exp.exponent.ActivityResultListener
import host.exp.expoview.Exponent
import android.content.Intent
import abi48_0_0.com.facebook.react.bridge.ReactContext
import abi48_0_0.expo.modules.adapters.react.services.UIManagerModuleWrapper
import abi48_0_0.expo.modules.core.interfaces.ActivityEventListener
import java.util.concurrent.CopyOnWriteArraySet

class ScopedUIManagerModuleWrapper(reactContext: ReactContext) :
  UIManagerModuleWrapper(reactContext), ActivityResultListener {
  // We use `CopyOnWriteArraySet` to make this container thread-safe,
  // cause `onActivityResult` can be trigger on a different thread during the listener unregistering.
  private val activityEventListeners = CopyOnWriteArraySet<ActivityEventListener>()

  override fun registerActivityEventListener(activityEventListener: ActivityEventListener) {
    if (activityEventListeners.isEmpty()) {
      Exponent.instance.addActivityResultListener(this)
    }
    activityEventListeners.add(activityEventListener)
  }

  override fun unregisterActivityEventListener(activityEventListener: ActivityEventListener) {
    activityEventListeners.remove(activityEventListener)
    if (activityEventListeners.isEmpty()) {
      Exponent.instance.removeActivityResultListener(this)
    }
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    for (listener in activityEventListeners) {
      listener.onActivityResult(Exponent.instance.currentActivity, requestCode, resultCode, data)
    }
  }
}
