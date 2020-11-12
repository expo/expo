package expo.modules.developmentclient.launcher.loaders

import android.content.Context
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.os.Build
import android.view.View
import androidx.appcompat.app.AppCompatDelegate
import com.facebook.react.ReactActivity
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientManifest

class DevelopmentClientExpoAppLoader(
  private val manifest: DevelopmentClientManifest,
  appHost: ReactNativeHost,
  context: Context
) : DevelopmentClientAppLoader(appHost, context) {
  override fun getBundleUrl(): String {
    return manifest.bundleUrl
  }

  override fun onCreate(activity: ReactActivity) {
    applyOrientation(activity)
    applyUiMode(activity)
  }

  override fun onReactContext(context: ReactContext) {
    context.currentActivity?.run {
      val rootView = findViewById<View>(android.R.id.content).rootView
      applyBackgroundColor(rootView)
    }
  }

  private fun applyBackgroundColor(view: View) {
    val backgroundColor = manifest.android?.backgroundColor ?: manifest.backgroundColor ?: return
    view.setBackgroundColor(Color.parseColor(backgroundColor))
  }

  private fun applyOrientation(activity: ReactActivity) {
    when (manifest.orientation) {
      "default" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      "portrait" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      "landscape" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
      else -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }
  }

  private fun applyUiMode(activity: ReactActivity) {
    val uiMode = manifest
      .android
      ?.userInterfaceStyle
      ?.let {
        when (it) {
          "automatic" -> {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
              AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY
            } else AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
          }
          "dark" -> AppCompatDelegate.MODE_NIGHT_YES
          "light" -> AppCompatDelegate.MODE_NIGHT_NO
          else -> AppCompatDelegate.MODE_NIGHT_NO
        }
      } ?: AppCompatDelegate.MODE_NIGHT_NO
    activity.delegate.localNightMode = uiMode
  }
}
