package expo.modules.devlauncher.react

import android.content.Context
import com.facebook.react.packagerconnection.PackagerConnectionSettings

class DevLauncherPackagerConnectionSettings(
  context: Context,
  private var serverIp: String
) : PackagerConnectionSettings(context) {
  override var debugServerHost: String
    get() = serverIp
    set(value) {}
}
