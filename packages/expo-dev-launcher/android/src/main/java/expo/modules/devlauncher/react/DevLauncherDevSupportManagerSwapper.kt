package expo.modules.devlauncher.react

import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.DisabledDevSupportManager
import expo.modules.devlauncher.helpers.getProtectedFieldValue
import expo.modules.devlauncher.helpers.setProtectedDeclaredField

class DevLauncherDevSupportManagerSwapper {
  fun swapDevSupportManagerImpl(
    reactInstanceManager: ReactInstanceManager,
  ) {
    val currentDevSupportManager = reactInstanceManager.devSupportManager
    if (currentDevSupportManager is DisabledDevSupportManager) {
      Log.i("DevLauncher", "DevSupportManager is disabled. So we don't want to override it.")
      return
    }
    try {
      val devManagerClass = DevSupportManagerBase::class.java
      val newDevSupportManager = DevLauncherDevSupportManager(
        applicationContext = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mApplicationContext"),
        reactInstanceManagerHelper = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mReactInstanceManagerHelper"),
        packagerPathForJSBundleName = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mJSAppBundleName"),
        enableOnCreate = true,
        redBoxHandler = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mRedBoxHandler"),
        devBundleDownloadListener = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mBundleDownloadListener"),
        minNumShakes = 1,
        customPackagerCommandHandlers = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "mCustomPackagerCommandHandlers")
      )

      ReactInstanceManager::class.java.setProtectedDeclaredField(reactInstanceManager, "mDevSupportManager", newDevSupportManager)
    } catch (e: Exception) {
      Log.i("DevLauncher", "Couldn't inject `DevLauncherDevSupportManager`.", e)
    }
  }
}
