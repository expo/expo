package expo.modules.devlauncher

import android.content.Context
import expo.modules.updates.UpdatesController

object DevLauncherUpdatesInterfaceDelegate {
  fun initializeUpdatesInterface(context: Context) {
    DevLauncherController.instance.updatesInterface = UpdatesController.initializeAsDevLauncherWithoutStarting(context, DevLauncherController.instance)
  }
}
