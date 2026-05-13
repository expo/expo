package expo.modules.devlauncher.modules

import android.net.Uri
import com.facebook.react.ReactActivity
import expo.modules.devlauncher.DevLauncherController
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch

class ExpoDevLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDevLauncher")

    AsyncFunction("loadApp") { url: Uri, promise: Promise ->
      if (url.scheme.isNullOrEmpty()) {
        throw DevLauncherInvalidURLException()
      }

      val devLauncherController =
        DevLauncherController.nullableInstance ?: throw DevLauncherNotAvailableException()
      val currentActivity = appContext.currentActivity as? ReactActivity

      devLauncherController.coroutineScope.launch {
        try {
          devLauncherController.loadApp(url, null, currentActivity)
        } catch (e: Exception) {
          promise.reject("ExpoDevLauncher", "Failed to load app", DevLauncherLoadAppException(e))
        }
      }
    }
  }
}
