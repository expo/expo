package expo.modules.devlauncher.react

import android.util.Log
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.common.ShakeDetector
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.JSPackagerClient
import com.facebook.react.runtime.ReactHostImpl
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devlauncher.helpers.getProtectedFieldValue
import expo.modules.devlauncher.helpers.setProtectedDeclaredField
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.rncompatibility.DevLauncherBridgeDevSupportManager
import expo.modules.devlauncher.rncompatibility.DevLauncherBridgelessDevSupportManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.koin.core.component.inject

internal class DevLauncherDevSupportManagerSwapper : DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface by inject()

  fun swapDevSupportManagerImpl(reactHost: ReactHostWrapper) {
    if (reactHost.isBridgelessMode) {
      swapDevSupportManagerImpl(reactHost.reactHost)
    } else {
      swapDevSupportManagerImpl(reactHost.reactNativeHost)
    }
  }

  private fun swapDevSupportManagerImpl(reactNativeHost: ReactNativeHost) {
    val reactInstanceManager = reactNativeHost.reactInstanceManager
    val currentDevSupportManager = reactInstanceManager.devSupportManager
    if (currentDevSupportManager is DevLauncherBridgeDevSupportManager) {
      // DevSupportManager was swapped by the DevLauncherReactNativeHostHandler
      return
    }

    var devSupportManagerClass: Class<*>
    try {
      // react-native version 0.75.0 renamed DisabledDevSupportManager to ReleaseDevSupportManager
      devSupportManagerClass = Class.forName("com.facebook.react.devsupport.ReleaseDevSupportManager")
    } catch (e: ClassNotFoundException) {
      devSupportManagerClass = Class.forName("com.facebook.react.devsupport.DisabledDevSupportManager")
    }
    if (devSupportManagerClass.isInstance(reactInstanceManager.devSupportManager)) {
      Log.i("DevLauncher", "DevSupportManager is disabled. So we don't want to override it.")
      return
    }

    try {
      val devManagerClass = DevSupportManagerBase::class.java
      val newDevSupportManager = createDevLauncherBridgeDevSupportManager(devManagerClass, currentDevSupportManager)

      ReactInstanceManager::class.java.setProtectedDeclaredField(reactInstanceManager, "mDevSupportManager", newDevSupportManager)

      closeExistingConnection(devManagerClass, currentDevSupportManager)
    } catch (e: Exception) {
      Log.i("DevLauncher", "Couldn't inject `DevLauncherDevSupportManager`.", e)
    }
  }

  private fun swapDevSupportManagerImpl(reactHost: ReactHost) {
    val currentDevSupportManager = requireNotNull(reactHost.devSupportManager)
    if (currentDevSupportManager is DevLauncherBridgelessDevSupportManager) {
      // DevSupportManager was swapped by the DevLauncherReactNativeHostHandler
      return
    }

    var devSupportManagerClass: Class<*>
    try {
      // react-native version 0.75.0 renamed DisabledDevSupportManager to ReleaseDevSupportManager
      devSupportManagerClass = Class.forName("com.facebook.react.devsupport.ReleaseDevSupportManager")
    } catch (e: ClassNotFoundException) {
      devSupportManagerClass = Class.forName("com.facebook.react.devsupport.DisabledDevSupportManager")
    }
    if (devSupportManagerClass.isInstance(currentDevSupportManager)) {
      Log.i("DevLauncher", "DevSupportManager is disabled. So we don't want to override it.")
      return
    }

    try {
      val devManagerClass = DevSupportManagerBase::class.java
      val newDevSupportManager = createDevLauncherBridgelessDevSupportManager(
        devManagerClass,
        currentDevSupportManager,
        reactHost
      )

      ReactHostImpl::class.java.setProtectedDeclaredField(reactHost, "mDevSupportManager", newDevSupportManager)

      closeExistingConnection(devManagerClass, currentDevSupportManager)
    } catch (e: Exception) {
      Log.i("DevLauncher", "Couldn't inject `DevLauncherDevSupportManager`.", e)
    }
  }

  private fun createDevLauncherBridgeDevSupportManager(
    devManagerClass: Class<*>,
    currentDevSupportManager: DevSupportManager
  ): DevLauncherBridgeDevSupportManager {
    return DevLauncherBridgeDevSupportManager(
      applicationContext = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mApplicationContext"),
      reactInstanceDevHelper = devManagerClass.getProtectedFieldValue(currentDevSupportManager, DevLauncherBridgeDevSupportManager.getDevHelperInternalFieldName()),
      packagerPathForJSBundleName = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mJSAppBundleName"),
      enableOnCreate = true,
      redBoxHandler = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mRedBoxHandler"),
      devBundleDownloadListener = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mBundleDownloadListener"),
      minNumShakes = 1,
      customPackagerCommandHandlers = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mCustomPackagerCommandHandlers")
    )
  }

  private fun createDevLauncherBridgelessDevSupportManager(
    devManagerClass: Class<*>,
    currentDevSupportManager: DevSupportManager,
    reactHost: ReactHost
  ): DevLauncherBridgelessDevSupportManager {
    return DevLauncherBridgelessDevSupportManager(
      host = reactHost as ReactHostImpl,
      context = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mApplicationContext"),
      packagerPathForJSBundleName = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mJSAppBundleName")
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
