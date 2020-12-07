package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.graphics.Color
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReactContext
import expo.modules.devlauncher.helpers.isValidColor
import expo.modules.devlauncher.launcher.configurators.DevLauncherExpoActivityConfigurator
import expo.modules.devlauncher.launcher.manifest.DevelopmentClientManifest

class DevLauncherExpoAppLoader(
  private val manifest: DevelopmentClientManifest,
  appHost: ReactNativeHost,
  context: Context,
  private val activityConfigurator: DevLauncherExpoActivityConfigurator =
    DevLauncherExpoActivityConfigurator(manifest, context)
) : DevLauncherAppLoader(appHost, context) {
  override fun getBundleUrl(): String {
    return manifest.bundleUrl
  }

  override fun onCreate(activity: ReactActivity) = with(activityConfigurator) {
    applyOrientation(activity)
    applyUiMode(activity)
    applyStatusBarConfiguration(activity)
    applyTaskDescription(activity)
  }

  override fun onReactContext(context: ReactContext) {
    context.currentActivity?.run {
      val rootView = findViewById<View>(android.R.id.content).rootView
      applyBackgroundColor(rootView)
    }
  }

  private fun applyBackgroundColor(view: View) {
    val backgroundColor = manifest.backgroundColor ?: return
    if (!isValidColor(backgroundColor)) {
      return
    }
    view.setBackgroundColor(Color.parseColor(backgroundColor))
  }

  override fun getAppName(): String? {
    return manifest.name
  }
}
