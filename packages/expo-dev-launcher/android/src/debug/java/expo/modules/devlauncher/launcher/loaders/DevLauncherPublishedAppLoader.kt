package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.helpers.injectLocalBundleLoader
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.manifests.core.Manifest

/**
 * Implementation of DevLauncherExpoAppLoader which is used for loading published projects served
 * remotely.
 */
class DevLauncherPublishedAppLoader(
  manifest: Manifest,
  private val localBundlePath: String,
  private val appHost: ReactHostWrapper,
  context: Context,
  controller: DevLauncherControllerInterface
) : DevLauncherExpoAppLoader(manifest, appHost, context, controller) {
  override fun injectBundleLoader(): Boolean {
    return injectLocalBundleLoader(appHost, localBundlePath)
  }
}
