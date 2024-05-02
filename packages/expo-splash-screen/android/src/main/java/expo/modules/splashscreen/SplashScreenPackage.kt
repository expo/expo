package expo.modules.splashscreen

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.SingletonModule
import expo.modules.splashscreen.singletons.SplashScreen

class SplashScreenPackage : Package {
  override fun createSingletonModules(context: Context?): List<SingletonModule> {
    return listOf(SplashScreen)
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SplashScreenReactActivityLifecycleListener())
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    return listOf(SplashScreenReactActivityHandler())
  }
}
