package expo.modules.devlauncher

import android.content.Context
import expo.modules.updates.UpdatesDevLauncherController

object DevLauncherUpdatesInterfaceDelegate {
  fun initializeUpdatesInterface(context: Context) {
    DevLauncherController.instance.updatesInterface = UpdatesDevLauncherController.initialize(context)
  }
}
