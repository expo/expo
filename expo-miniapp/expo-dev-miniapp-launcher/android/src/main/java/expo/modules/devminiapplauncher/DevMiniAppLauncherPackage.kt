package expo.modules.devminiapplauncher

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.Package

class DevMiniAppLauncherPackage : BasePackage() {
  override fun createInternalModules(context: Context) =
    listOf(DevMiniAppLauncherModule())
}
