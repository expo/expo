package expo.modules.devlauncher.splashscreen

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.view.ViewGroup
import androidx.core.graphics.ColorUtils

class DevLauncherSplashScreenProvider {
  fun attachSplashScreenViewAsync(activity: Activity): DevLauncherSplashScreen? {
      val contentView = activity.findViewById<ViewGroup>(android.R.id.content)
        ?: return null
      val backgroundColor = getBackgroundColor(activity)
      val splashScreenView = DevLauncherSplashScreen(
        activity,
        getTextColorForBackgroundColor(backgroundColor)
      )
      splashScreenView.setBackgroundColor(backgroundColor)
      contentView.addView(splashScreenView)

      return splashScreenView
  }

  private fun getBackgroundColor(context: Context): Int {
    val expoSplashScreenColor = context
      .resources
      .getIdentifier(
        "splashscreen_background",
        "drawable",
        context.packageName
      )

    return if (expoSplashScreenColor == 0) {
      // splashscreen_background doesn't exist
      Color.parseColor("#000020")
    } else {
      expoSplashScreenColor
    }
  }

  private fun getTextColorForBackgroundColor(backgroundColor: Int): Int {
    val luminance = ColorUtils.calculateLuminance(backgroundColor)
    return if (luminance > 0.5) {
      Color.BLACK
    } else {
      Color.WHITE
    }
  }
}
