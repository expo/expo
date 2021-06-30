package org.unimodules.adapters.react

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import com.facebook.react.ReactNativeHost
import org.unimodules.core.interfaces.ApplicationLifecycleListener

abstract class ReactNativeHostWrapper(application: Application) : ReactNativeHost(application) {
  private val applicationLifecycleListeners: ArrayList<ApplicationLifecycleListener> = ArrayList()
  init {
    for (pkg in ExpoModulesPackageList.getPackageList()) {
      applicationLifecycleListeners.addAll(pkg.createApplicationLifecycleListeners(application))
    }
  }

  fun onApplicationCreate(application: Application) {
    for (listener in applicationLifecycleListeners) {
      listener.onCreate(application)
    }
  }

  fun onApplicationConfigurationChanged(context: Context, newConfig: Configuration) {
    for (listener in applicationLifecycleListeners) {
      listener.onConfigurationChanged(newConfig)
    }
  }
}