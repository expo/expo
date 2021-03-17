package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import android.net.Uri
import com.facebook.react.ReactNativeHost

class DevLauncherReactNativeAppLoader(
  private val url: Uri,
  appHost: ReactNativeHost,
  context: Context
) : DevLauncherAppLoader(appHost, context) {
  override fun getBundleUrl(): Uri {
    return url
  }
}
