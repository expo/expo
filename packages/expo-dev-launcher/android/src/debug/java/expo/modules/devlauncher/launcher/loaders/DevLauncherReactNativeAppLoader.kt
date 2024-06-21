package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.helpers.injectReactInterceptor
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface

class DevLauncherReactNativeAppLoader(
  private val url: Uri,
  private val appHost: ReactHostWrapper,
  private val context: Context,
  controller: DevLauncherControllerInterface
) : DevLauncherAppLoader(appHost, context, controller) {
  override fun injectBundleLoader(): Boolean {
    return injectReactInterceptor(context, appHost, url)
  }
}
