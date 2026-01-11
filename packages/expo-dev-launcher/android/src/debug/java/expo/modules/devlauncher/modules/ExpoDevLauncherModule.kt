package expo.modules.devlauncher.modules

import android.util.Log
import androidx.core.net.toUri
import com.facebook.react.ReactActivity
import expo.modules.devlauncher.DevLauncherController
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch

class ExpoDevLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDevLauncher")

    AsyncFunction("loadApp") { urlString: String, projectUrlString: String? ->
      val url = urlString.toUri()
      if (url.scheme.isNullOrEmpty()) {
        throw DevLauncherInvalidURLException()
      }

      val projectUrl = projectUrlString?.let {
        val parsedProjectUrl = it.toUri()
        if (parsedProjectUrl.scheme.isNullOrEmpty()) {
          throw DevLauncherInvalidProjectURLException()
        }
        parsedProjectUrl
      }

      val devLauncherController =
        DevLauncherController.nullableInstance ?: throw DevLauncherNotAvailableException()
      val currentActivity = appContext.currentActivity as? ReactActivity

      devLauncherController.coroutineScope.launch {
        try {
          devLauncherController.loadApp(url, projectUrl, currentActivity)
        } catch (e: Exception) {
          Log.w("ExpoDevLauncher", "Failed to load app", DevLauncherLoadAppException(e))
        }
      }
    }
  }
}
