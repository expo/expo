package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.helpers.injectReactInterceptor
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.manifests.core.Manifest

/**
 * Implementation of DevLauncherExpoAppLoader which is used for loading locally served projects in
 * development.
 */
class DevLauncherLocalAppLoader(
  private val manifest: Manifest,
  private val appHost: ReactHostWrapper,
  private val context: Context,
  controller: DevLauncherControllerInterface
) : DevLauncherExpoAppLoader(manifest, appHost, context, controller) {
  override fun injectBundleLoader(): Boolean {
    return injectReactInterceptor(context, appHost, Uri.parse(manifest.getBundleURL()))
  }
}
