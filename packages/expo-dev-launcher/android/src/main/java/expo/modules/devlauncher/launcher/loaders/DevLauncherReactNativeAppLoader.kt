package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import com.facebook.react.ReactNativeHost

class DevLauncherReactNativeAppLoader(
  private val url: String,
  appHost: ReactNativeHost,
  context: Context
) : DevLauncherAppLoader(appHost, context) {
  override fun getBundleUrl(): String {
    return url
  }
}
