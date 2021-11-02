package expo.modules

import android.app.Application
import android.content.res.Configuration
import expo.modules.core.ModulePriorities

class ApplicationLifecycleDispatcher private constructor() {
  companion object {
    @JvmStatic
    fun onApplicationCreate(application: Application) {
      ExpoModulesPackage.packageList
        .sortedByDescending { ModulePriorities.get(it::class.qualifiedName) }
        .flatMap { it.createApplicationLifecycleListeners(application) }
        .forEach { it.onCreate(application) }
    }

    @JvmStatic
    fun onConfigurationChanged(application: Application, newConfig: Configuration) {
      ExpoModulesPackage.packageList
        .sortedByDescending { ModulePriorities.get(it::class.qualifiedName) }
        .flatMap { it.createApplicationLifecycleListeners(application) }
        .forEach { it.onConfigurationChanged(newConfig) }
    }
  }
}
