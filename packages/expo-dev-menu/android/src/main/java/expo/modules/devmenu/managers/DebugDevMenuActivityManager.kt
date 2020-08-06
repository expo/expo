package expo.modules.devmenu.managers

import com.facebook.react.modules.systeminfo.AndroidInfoHelpers

class DebugDevMenuActivityManager : DevMenuActivityManager() {
  private var devServerPort = AndroidInfoHelpers.sDevServerPortOverride
  private var applicationBundler = true

  override fun switchBundler() = synchronized(this) {
    if (applicationBundler) {
      devServerPort = AndroidInfoHelpers.sDevServerPortOverride
      AndroidInfoHelpers.sDevServerPortOverride = 2137
      applicationBundler = false
    } else {
      AndroidInfoHelpers.sDevServerPortOverride = devServerPort
      applicationBundler = true
    }
  }
}
