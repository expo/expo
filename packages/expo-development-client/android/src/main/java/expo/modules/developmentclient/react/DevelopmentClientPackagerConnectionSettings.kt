package expo.modules.developmentclient.react

import android.content.Context
import com.facebook.react.packagerconnection.PackagerConnectionSettings

class DevelopmentClientPackagerConnectionSettings(
  context: Context,
  private var serverIp: String
) : PackagerConnectionSettings(context) {
  override fun getDebugServerHost() = serverIp

  override fun setDebugServerHost(host: String) = Unit
}
