package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import com.facebook.react.ReactHost
import expo.modules.devlauncher.helpers.injectReactInterceptor
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface

class DevLauncherReactNativeAppLoader(
  private val url: Uri,
  private val appHost: ReactHost,
  private val context: Context,
  controller: DevLauncherControllerInterface
) : DevLauncherAppLoader(appHost, context, controller) {
  override fun injectBundleLoader(): Boolean {
    return injectReactInterceptor(context, appHost, url)
  }
}
