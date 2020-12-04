package expo.modules.developmentclient.react

import android.content.Context
import com.facebook.react.devsupport.DevInternalSettings

class DevelopmentClientInternalSettings(
  context: Context,
  debugServerHost: String
) : DevInternalSettings(context, null) {
  private var packagerConnectionSettings = DevelopmentClientPackagerConnectionSettings(context, debugServerHost)

  override fun getPackagerConnectionSettings() = packagerConnectionSettings
}
