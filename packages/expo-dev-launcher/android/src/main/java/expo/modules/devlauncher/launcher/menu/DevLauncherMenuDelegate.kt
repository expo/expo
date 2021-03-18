package expo.modules.devlauncher.launcher.menu

import android.os.Bundle
import com.facebook.react.ReactInstanceManager
import expo.interfaces.devmenu.DevMenuDelegateInterface
import expo.modules.devlauncher.BuildConfig
import expo.modules.devlauncher.DevLauncherController

private class LauncherDelegate(private val controller: DevLauncherController) : DevMenuDelegateInterface {
  override fun appInfo(): Bundle = Bundle().apply {
    putString("appName", "Development Client")
    putString("appVersion", BuildConfig.VERSION)
    putString("appIcon", null)
    putString("hostUrl", null)
  }

  override fun reactInstanceManager(): ReactInstanceManager {
    return controller.devClientHost.reactInstanceManager
  }

  override fun supportsDevelopment(): Boolean {
    return false
  }
}

private class AppDelegate(private val controller: DevLauncherController) : DevMenuDelegateInterface {
  override fun appInfo(): Bundle = Bundle().apply {
    putString("appName", controller.manifest?.name ?: "Development Client - App")
    putString("appVersion", controller.manifest?.version)
    putString("appIcon", null)
    putString("hostUrl", controller.manifest?.hostUri
      ?: reactInstanceManager().devSupportManager?.sourceUrl)
  }

  override fun reactInstanceManager(): ReactInstanceManager {
    return controller.appHost.reactInstanceManager
  }

  override fun supportsDevelopment(): Boolean {
    return true
  }
}

class DevLauncherMenuDelegate(private val controller: DevLauncherController) : DevMenuDelegateInterface {
  private val launcherDelegate = LauncherDelegate(controller)
  private val appDelegate = AppDelegate(controller)

  private val currentDelegate: DevMenuDelegateInterface
    get() = if (controller.mode == DevLauncherController.Mode.LAUNCHER) {
      launcherDelegate
    } else {
      appDelegate
    }

  override fun appInfo(): Bundle? {
    return currentDelegate.appInfo()
  }

  override fun reactInstanceManager(): ReactInstanceManager {
    return currentDelegate.reactInstanceManager()
  }

  override fun supportsDevelopment(): Boolean {
    return currentDelegate.supportsDevelopment()
  }
}
