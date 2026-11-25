package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.bridge.JSBundleLoader
import expo.modules.devlauncher.helpers.injectBundleLoader
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface

/**
 * Implementation of DevLauncherAppLoader which loads an embedded JS bundle
 * from the app's assets directory (index.android.bundle).
 */
class DevLauncherEmbeddedAppLoader(
  private val appHost: ReactHost,
  private val context: Context,
  controller: DevLauncherControllerInterface,
  private val assetBundlePath: String = "assets://index.android.bundle"
) : DevLauncherAppLoader(appHost, context, controller) {
  override fun injectBundleLoader(): Boolean {
    val loader = JSBundleLoader.createAssetLoader(context, assetBundlePath, true)
    return injectBundleLoader(appHost, loader)
  }
}
