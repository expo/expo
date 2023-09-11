package abi48_0_0.expo.modules

import android.app.Application
import android.content.res.Configuration
import androidx.annotation.UiThread
import abi48_0_0.expo.modules.core.interfaces.ApplicationLifecycleListener

object ApplicationLifecycleDispatcher {
  private var listeners: List<ApplicationLifecycleListener>? = null

  @UiThread
  private fun getCachedListeners(application: Application): List<ApplicationLifecycleListener> {
    return listeners ?: ExpoModulesPackage.packageList
      .flatMap { it.createApplicationLifecycleListeners(application) }
      .also { listeners = it }
  }

  @JvmStatic
  fun onApplicationCreate(application: Application) {
    getCachedListeners(application).forEach { it.onCreate(application) }
  }

  @JvmStatic
  fun onConfigurationChanged(application: Application, newConfig: Configuration) {
    getCachedListeners(application).forEach { it.onConfigurationChanged(newConfig) }
  }
}
