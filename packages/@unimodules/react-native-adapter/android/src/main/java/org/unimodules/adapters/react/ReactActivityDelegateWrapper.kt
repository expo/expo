package org.unimodules.adapters.react

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import org.unimodules.core.interfaces.ReactActivityLifecycleListener

open class ReactActivityDelegateWrapper(
  activity: ReactActivity,
  mainComponentName: String?
) : ReactActivityDelegate(activity, mainComponentName) {
  private val reactActivityLifecycleListeners: ArrayList<ReactActivityLifecycleListener> = ArrayList()
  init {
    for (pkg in ExpoModulesPackageList.getPackageList()) {
      reactActivityLifecycleListeners.addAll(pkg.createReactActivityLifecycleListeners(activity))
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    for (listener in reactActivityLifecycleListeners) {
      listener.onCreate(plainActivity, savedInstanceState)
    }
  }

  override fun onResume() {
    super.onResume()
    for (listener in reactActivityLifecycleListeners) {
      listener.onResume(plainActivity)
    }
  }

  override fun onPause() {
    for (listener in reactActivityLifecycleListeners) {
      listener.onPause(plainActivity)
    }
    super.onPause()
  }

  override fun onDestroy() {
    for (listener in reactActivityLifecycleListeners) {
      listener.onDestroy(plainActivity)
    }
    super.onDestroy()
  }
}
