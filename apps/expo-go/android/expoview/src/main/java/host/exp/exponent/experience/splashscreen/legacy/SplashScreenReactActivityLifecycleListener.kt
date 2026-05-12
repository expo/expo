package host.exp.exponent.experience.splashscreen.legacy

import android.app.Activity
import com.facebook.react.ReactActivity
import com.facebook.react.ReactHost
import com.facebook.react.ReactRootView
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import host.exp.exponent.experience.splashscreen.legacy.singletons.SplashScreen

class SplashScreenReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onContentChanged(activity: Activity) {
    SplashScreen.ensureShown(
      activity,
      ReactRootView::class.java
    )
  }
}

class SplashScreenReactActivityHandler : ReactActivityHandler {
  override fun getDelayLoadAppHandler(
    activity: ReactActivity?,
    reactHost: ReactHost?
  ): ReactActivityHandler.DelayLoadAppHandler? {
    activity?.let {
      SplashScreen.ensureShown(
        it,
        ReactRootView::class.java
      )
    }
    return null
  }
}
