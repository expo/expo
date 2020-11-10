package expo.modules.developmentclient.launcher.loaders

import android.content.Context
import com.facebook.react.ReactNativeHost

class DevelopmentClientReactNativeAppLoader(
  private val url: String,
  appHost: ReactNativeHost,
  context: Context
) : DevelopmentClientAppLoader(appHost, context) {
  override fun getBundleUrl(): String {
    return url
  }
}
