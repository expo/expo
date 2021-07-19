package expo.modules.splashscreen

import android.content.Context
import expo.modules.splashscreen.singletons.SplashScreen
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.SingletonModule

class SplashScreenPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SplashScreenModule(context))
  }

  override fun createSingletonModules(context: Context?): List<SingletonModule> {
    return listOf(SplashScreen)
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SplashScreenReactActivityLifecycleListener(activityContext))
  }
}
