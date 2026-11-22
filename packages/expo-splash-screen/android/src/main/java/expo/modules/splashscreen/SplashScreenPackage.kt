package expo.modules.splashscreen

import android.app.Application
import android.content.Context
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package

class SplashScreenPackage : Package {
  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> = listOf(
    object : ApplicationLifecycleListener {
      override fun onCreate(application: Application) {
        // Reads the snapshot on a background thread while the app starts its first activity.
        SplashScreenPrerender.prepare(application)
      }
    }
  )
}
