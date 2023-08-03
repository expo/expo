package abi49_0_0.expo.modules.splashscreen

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.Handler
import abi49_0_0.com.facebook.react.ReactRootView
import abi49_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.splashscreen.singletons.SplashScreen

// this needs to stay for versioning to work
/* ktlint-disable no-unused-imports */
import expo.modules.splashscreen.SplashScreenImageResizeMode
import abi49_0_0.host.exp.expoview.R
/* ktlint-enable no-unused-imports */

class SplashScreenReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // To support backward compatible or SplashScreenImageResizeMode customization
    // that calling `SplashScreen.show()` in MainActivity,
    // we postpone the in-module call to the end of main loop.
    // If MainActivity.onCreate has `SplashScreen.show()`, it will override the call here.
    Handler(activity.mainLooper).post {
      SplashScreen.show(
        activity,
        getResizeMode(activity),
        ReactRootView::class.java,
        getStatusBarTranslucent(activity)
      )
    }
  }

  private fun getResizeMode(context: Context): SplashScreenImageResizeMode =
    SplashScreenImageResizeMode.fromString(
      context.getString(R.string.expo_splash_screen_resize_mode).lowercase()
    )
      ?: SplashScreenImageResizeMode.CONTAIN

  private fun getStatusBarTranslucent(context: Context): Boolean =
    context.getString(R.string.expo_splash_screen_status_bar_translucent).toBoolean()
}
