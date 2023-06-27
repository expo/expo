package abi49_0_0.expo.modules.localization

import android.content.Context
import android.content.res.Configuration
import abi49_0_0.expo.modules.core.interfaces.ApplicationLifecycleListener
import abi49_0_0.expo.modules.core.interfaces.Package

object Notifier {
  private val observers = mutableListOf<() -> Unit>()

  fun registerObserver(observer: () -> Unit) {
    observers.add(observer)
  }

  fun deregisterObserver(observer: () -> Unit) {
    observers.remove(observer)
  }

  fun onConfigurationChanged() {
    // Notify all observers
    observers.forEach { it() }
  }
}

// TODO: Move to new listener API once it's available
class LocalizationPackage : Package {
  override fun createApplicationLifecycleListeners(context: Context?): List<out ApplicationLifecycleListener> {
    return listOf(object : ApplicationLifecycleListener {
      override fun onConfigurationChanged(newConfig: Configuration?) {
        super.onConfigurationChanged(newConfig)
        Notifier.onConfigurationChanged()
      }
    })
  }
}
