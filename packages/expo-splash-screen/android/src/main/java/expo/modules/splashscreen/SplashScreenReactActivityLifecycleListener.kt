package expo.modules.splashscreen

import android.app.Activity
import android.content.Context
import com.facebook.react.ReactActivity
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactRootView
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.splashscreen.singletons.SplashScreen

class SplashScreenReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onContentChanged(activity: Activity) {
    SplashScreen.ensureShown(
      activity,
      getResizeMode(activity),
      ReactRootView::class.java,
      getStatusBarTranslucent(activity)
    )
  }
}

class SplashScreenReactActivityHandler : ReactActivityHandler {
  override fun getDelayLoadAppHandler(
    activity: ReactActivity,
    reactNativeHost: ReactNativeHost
  ): ReactActivityHandler.DelayLoadAppHandler? {
    SplashScreen.ensureShown(
      activity,
      getResizeMode(activity),
      ReactRootView::class.java,
      getStatusBarTranslucent(activity)
    )
    return null
  }
}

private fun getResizeMode(context: Context): SplashScreenImageResizeMode =
  SplashScreenImageResizeMode.fromString(
    context.getString(R.string.expo_splash_screen_resize_mode).lowercase()
  )
    ?: SplashScreenImageResizeMode.CONTAIN

private fun getStatusBarTranslucent(context: Context): Boolean =
  context.getString(R.string.expo_splash_screen_status_bar_translucent).toBoolean()
