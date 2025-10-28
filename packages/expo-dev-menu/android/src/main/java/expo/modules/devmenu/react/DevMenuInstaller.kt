package expo.modules.devmenu.react

import android.util.Log
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.RequestHandler
import expo.modules.devmenu.helpers.getPrivateDeclaredFieldValue
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue
import expo.modules.devmenu.websockets.DevMenuCommandHandlersProvider
import expo.modules.kotlin.weak

object DevMenuInstaller {
  fun install(devSupportManager: DevSupportManager) {
    if (devSupportManager !is DevSupportManagerBase) {
      Log.w("DevMenu", "DevSupportManager is not an instance of DevSupportManagerBase. Skipping installation of the dev menu.")
      return
    }

    installWebSocketHandlers(devSupportManager)
    uninstallDefaultShakeDetector(devSupportManager)
  }

  private fun installWebSocketHandlers(devSupportManager: DevSupportManagerBase) {
    val currentCommandHandlers =
      DevSupportManagerBase::class.java.getPrivateDeclaredFieldValue<_, Map<String, RequestHandler>?>(
        "customPackagerCommandHandlers",
        devSupportManager
      ) ?: emptyMap()

    val weakDevSupportManager = devSupportManager.weak()
    val handlers = DevMenuCommandHandlersProvider(weakDevSupportManager)
      .createCommandHandlers()

    val newCommandHandlers = currentCommandHandlers + handlers

    DevSupportManagerBase::class.java.setPrivateDeclaredFieldValue(
      "customPackagerCommandHandlers",
      devSupportManager,
      newCommandHandlers
    )
  }

  private fun uninstallDefaultShakeDetector(devSupportManager: DevSupportManagerBase) {
    DevMenuShakeDetectorListenerSwapper()
      .swapShakeDetectorListener(
        devSupportManager,
        newListener = {}
      )
  }
}
