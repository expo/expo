package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import com.facebook.react.ReactNativeHost
import expo.modules.devlauncher.helpers.injectLocalBundleLoader
import expo.modules.devlauncher.launcher.manifest.DevLauncherManifest

/**
 * Implementation of DevLauncherExpoAppLoader which is used for loading published projects served
 * remotely.
 */
class DevLauncherPublishedAppLoader(
  manifest: DevLauncherManifest,
  private val localBundlePath: String,
  private val appHost: ReactNativeHost,
  context: Context
) : DevLauncherExpoAppLoader(manifest, appHost, context) {
  override fun injectBundleLoader(): Boolean {
    return injectLocalBundleLoader(appHost, localBundlePath)
  }
}
