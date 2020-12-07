package expo.modules.devlauncher.react

import android.content.Context
import com.facebook.react.devsupport.DevInternalSettings

class DevLauncherInternalSettings(
  context: Context,
  debugServerHost: String
) : DevInternalSettings(context, null) {
  private var packagerConnectionSettings = DevLauncherPackagerConnectionSettings(context, debugServerHost)

  override fun getPackagerConnectionSettings() = packagerConnectionSettings
}
