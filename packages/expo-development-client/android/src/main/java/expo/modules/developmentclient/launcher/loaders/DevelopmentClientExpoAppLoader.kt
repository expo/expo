package expo.modules.developmentclient.launcher.loaders

import android.content.Context
import android.graphics.Color
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReactContext
import expo.modules.developmentclient.helpers.isValidColor
import expo.modules.developmentclient.launcher.configurators.DevelopmentClientExpoActivityConfigurator
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientManifest

class DevelopmentClientExpoAppLoader(
  private val manifest: DevelopmentClientManifest,
  appHost: ReactNativeHost,
  context: Context,
  private val activityConfigurator: DevelopmentClientExpoActivityConfigurator =
    DevelopmentClientExpoActivityConfigurator(manifest, context)
) : DevelopmentClientAppLoader(appHost, context) {
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
