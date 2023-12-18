@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package abi49_0_0.expo.modules.splashscreen

import android.app.Activity
import android.content.Context
import abi49_0_0.com.facebook.react.ReactRootView
import abi49_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.splashscreen.singletons.SplashScreen

// this needs to stay for versioning to work
import expo.modules.splashscreen.SplashScreenImageResizeMode
import expo.modules.splashscreen.R

class SplashScreenReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onContentChanged(activity: Activity) {
    SplashScreen.show(
      activity,
      getResizeMode(activity),
      ReactRootView::class.java,
      getStatusBarTranslucent(activity)
    )
  }

  private fun getResizeMode(context: Context): SplashScreenImageResizeMode =
    SplashScreenImageResizeMode.fromString(
      context.getString(R.string.expo_splash_screen_resize_mode).lowercase()
    )
      ?: SplashScreenImageResizeMode.CONTAIN

  private fun getStatusBarTranslucent(context: Context): Boolean =
    context.getString(R.string.expo_splash_screen_status_bar_translucent).toBoolean()
}
