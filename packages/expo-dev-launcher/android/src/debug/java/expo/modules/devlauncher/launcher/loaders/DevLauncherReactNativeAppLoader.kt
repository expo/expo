package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import com.facebook.react.ReactNativeHost
import expo.modules.devlauncher.helpers.injectReactInterceptor

class DevLauncherReactNativeAppLoader(
  private val url: Uri,
  private val appHost: ReactNativeHost,
  private val context: Context
) : DevLauncherAppLoader(appHost, context) {
  override fun injectBundleLoader(): Boolean {
    return injectReactInterceptor(context, appHost, url)
  }
}
