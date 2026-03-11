package expo.modules.devlauncher.react

import android.util.Log
import com.facebook.react.ReactHost
import com.facebook.react.common.ShakeDetector
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.JSPackagerClient
import com.facebook.react.runtime.ReactHostImpl
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.helpers.getProtectedFieldValue
import expo.modules.devlauncher.helpers.setProtectedDeclaredField
import expo.modules.devmenu.api.DevMenuApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

internal class DevLauncherDevSupportManagerSwapper {
  private val controller = DevLauncherController.instance

  fun swapDevSupportManagerImpl(reactHost: ReactHost) {
    val currentDevSupportManager = requireNotNull(reactHost.devSupportManager)

    DevMenuApi.installWebSocketHandlers(currentDevSupportManager)
    DevMenuApi.uninstallDefaultShakeDetector(currentDevSupportManager)

    if (currentDevSupportManager is DevLauncherBridgelessDevSupportManager) {
      // DevSupportManager was swapped by the DevLauncherReactNativeHostHandler
      return
    }
    if (currentDevSupportManager is ReleaseDevSupportManager) {
      Log.i("DevLauncher", "DevSupportManager is disabled. So we don't want to override it.")
      return
    }

    try {
      val devManagerClass = DevSupportManagerBase::class.java
      val newDevSupportManager = createDevLauncherBridgelessDevSupportManager(
        devManagerClass,
        currentDevSupportManager
      )

      DevMenuApi.uninstallDefaultShakeDetector(newDevSupportManager)

      ReactHostImpl::class.java.setProtectedDeclaredField(reactHost, "devSupportManager", newDevSupportManager)

      closeExistingConnection(devManagerClass, currentDevSupportManager)
    } catch (e: Exception) {
      Log.i("DevLauncher", "Couldn't inject `DevLauncherDevSupportManager`.", e)
    }
  }

  private fun createDevLauncherBridgelessDevSupportManager(
    devManagerClass: Class<*>,
    currentDevSupportManager: DevSupportManager
  ): DevLauncherBridgelessDevSupportManager {
    return DevLauncherBridgelessDevSupportManager(
      applicationContext = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "applicationContext"),
      reactInstanceDevHelper = devManagerClass.getProtectedFieldValue(currentDevSupportManager, DevLauncherBridgelessDevSupportManager.getDevHelperInternalFieldName()),
      packagerPathForJSBundleName = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "jsAppBundleName"),
      enableOnCreate = true,
      redBoxHandler = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "redBoxHandler"),
      devBundleDownloadListener = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "devBundleDownloadListener"),
      minNumShakes = Int.MAX_VALUE / 10, // this is multiplied later by the RN code
      customPackagerCommandHandlers = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "customPackagerCommandHandlers")
    )
  }

  /**
   * We need to invalidate the old packager connection.
   * However, this connection is established in the background
   * and we don't know when it will be available (see [DevServerHelper.openPackagerConnection]).
   * So we just wait for connection and then we kill it.
   */
  private fun closeExistingConnection(devManagerClass: Class<*>, devSupportManager: DevSupportManager) {
    controller.coroutineScope.launch {
      try {
        while (true) {
          // Invalidate shake detector - not doing that leads to memory leaks
          tryToStopShakeDetector(devSupportManager)

          val devServerHelper: DevServerHelper = devManagerClass.getProtectedFieldValue(
            devSupportManager,
            "devServerHelper"
          )

          try {
            val packagerClient: JSPackagerClient? = DevServerHelper::class.java.getProtectedFieldValue(
              devServerHelper,
              "packagerClient"
            )

            if (packagerClient != null) {
              devServerHelper.closePackagerConnection()
              return@launch
            }
          } catch (e: NoSuchFieldException) {
            Log.w("DevLauncher", "Couldn't close the packager connection", e)
          }

          delay(50)
        }
      } catch (e: Exception) {
        Log.w("DevLauncher", "Couldn't close the packager connection: ${e.message}", e)
      }
    }
  }

  private fun tryToStopShakeDetector(currentDevSupportManager: DevSupportManager) {
    try {
      val shakeDetector: ShakeDetector =
        DevSupportManagerBase::class.java.getProtectedFieldValue(
          currentDevSupportManager,
          "shakeDetector"
        )
      shakeDetector.stop()
    } catch (e: Exception) {
      Log.w("DevLauncher", "Couldn't stop shake detector.", e)
    }
  }
}
