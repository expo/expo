package expo.modules.splashscreen

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.SingletonModule
import expo.modules.splashscreen.SplashScreenManager

class SplashScreenPackage : Package {



  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        super.onCreate(activity, savedInstanceState)
        SplashScreenManager.registerOnActivity(activity);
      }

      override fun onContentChanged(activity: Activity?) {
        super.onContentChanged(activity)
        SplashScreenManager.onContentChanged(activity)
      }
    })
  }
}
