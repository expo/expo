package expo.modules.devlauncher.splashscreen

import android.app.Activity
import android.view.ViewGroup

class DevLauncherSplashScreenProvider {
  fun attachSplashScreenViewAsync(activity: Activity): DevLauncherSplashScreen? {
    val contentView = activity.findViewById<ViewGroup>(android.R.id.content)
      ?: return null

    val splashScreenView = DevLauncherSplashScreen(
      activity,
    )

    contentView.addView(splashScreenView)
    return splashScreenView
  }
}
