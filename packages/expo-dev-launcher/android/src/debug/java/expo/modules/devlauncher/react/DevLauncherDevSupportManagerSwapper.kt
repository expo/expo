package expo.modules.devlauncher.react

import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.common.ShakeDetector
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.DisabledDevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.JSPackagerClient
import expo.modules.devlauncher.helpers.getProtectedFieldValue
import expo.modules.devlauncher.helpers.setProtectedDeclaredField
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.rncompatibility.DevLauncherDevSupportManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.koin.core.component.inject

class DevLauncherDevSupportManagerSwapper : DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface by inject()

  fun swapDevSupportManagerImpl(
    reactInstanceManager: ReactInstanceManager
  ) {
    val currentDevSupportManager = reactInstanceManager.devSupportManager
    if (currentDevSupportManager is DevLauncherDevSupportManager) {
      // DevSupportManager was swapped by the DevLauncherReactNativeHostHandler
      return
    }

    if (currentDevSupportManager is DisabledDevSupportManager) {
      Log.i("DevLauncher", "DevSupportManager is disabled. So we don't want to override it.")
      return
    }
    try {
      val devManagerClass = DevSupportManagerBase::class.java
      val newDevSupportManager = DevLauncherDevSupportManager(
        applicationContext = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mApplicationContext"),
        reactInstanceManagerHelper = devManagerClass.getProtectedFieldValue(currentDevSupportManager, DevLauncherDevSupportManager.getDevHelperInternalFieldName()),
        packagerPathForJSBundleName = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mJSAppBundleName"),
        enableOnCreate = true,
        redBoxHandler = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mRedBoxHandler"),
        devBundleDownloadListener = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mBundleDownloadListener"),
        minNumShakes = 1,
        customPackagerCommandHandlers = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mCustomPackagerCommandHandlers")
      )

      ReactInstanceManager::class.java.setProtectedDeclaredField(reactInstanceManager, "mDevSupportManager", newDevSupportManager)

      /**
       * We need to invalidate the old packager connection.
       * However, this connection is established in the background
       * and we don't know when it will be available (see [DevServerHelper.openPackagerConnection]).
       * So we just wait for connection and then we kill it.
       */
      controller.coroutineScope.launch {
        try {
          while (true) {
            // Invalidate shake detector - not doing that leads to memory leaks
            tryToStopShakeDetector(currentDevSupportManager)

            val devServerHelper: DevServerHelper = devManagerClass.getProtectedFieldValue(
              currentDevSupportManager,
              "mDevServerHelper"
            )

            try {
              val packagerConnectionLock: Boolean = DevServerHelper::class.java.getProtectedFieldValue(
                devServerHelper,
                "mPackagerConnectionLock"
              )

              if (!packagerConnectionLock) {
                devServerHelper.closePackagerConnection()
                return@launch
              }
            } catch (_: NoSuchFieldException) {
              // mPackagerConnectionLock was removed from the React Native in v0.63.4
              val packagerClient: JSPackagerClient? = DevServerHelper::class.java.getProtectedFieldValue(
                devServerHelper,
                "mPackagerClient"
              )

              if (packagerClient != null) {
                devServerHelper.closePackagerConnection()
                return@launch
              }
            }

            delay(50)
          }
        } catch (e: Exception) {
          Log.w("DevLauncher", "Couldn't close the packager connection: ${e.message}", e)
        }
      }
    } catch (e: Exception) {
      Log.i("DevLauncher", "Couldn't inject `DevLauncherDevSupportManager`.", e)
    }
  }

  private fun tryToStopShakeDetector(currentDevSupportManager: DevSupportManager) {
    try {
      val shakeDetector: ShakeDetector =
        DevSupportManagerBase::class.java.getProtectedFieldValue(
          currentDevSupportManager,
          "mShakeDetector"
        )
      shakeDetector.stop()
    } catch (e: Exception) {
      Log.w("DevLauncher", "Couldn't stop shake detector.", e)
    }
  }
}
