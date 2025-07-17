package expo.modules.devlauncher.services

import android.content.Context
import androidx.core.net.toUri
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devmenu.AppInfo
import expo.modules.updatesinterface.UpdatesInterface
import org.json.JSONObject

sealed interface ApplicationInfo {
  val appName: String
  val appVersion: String?

  fun toJson(): String {
    return JSONObject().apply {
      put("appName", appName)
      put("appVersion", appVersion ?: JSONObject.NULL)
    }.toString(2)
  }

  data class Native(
    override val appName: String,
    override val appVersion: String? = null
  ) : ApplicationInfo

  data class Updates(
    override val appName: String,
    override val appVersion: String? = null,
    val appId: String,
    val runtimeVersion: String?,
    val projectUrl: String
  ) : ApplicationInfo {

    override fun toJson(): String {
      return JSONObject().apply {
        put("appName", appName)
        put("appVersion", appVersion ?: JSONObject.NULL)
        put("appId", appId)
        put("runtimeVersion", runtimeVersion ?: JSONObject.NULL)
        put("projectUrl", projectUrl)
      }.toString(2)
    }
  }
}

class AppService {
  private var _applicationInfo: ApplicationInfo? = null

  val applicationInfo: ApplicationInfo
    get() {
      if (_applicationInfo == null) {
        val devMenuInfo = AppInfo.native

        _applicationInfo = ApplicationInfo.Native(
          appName = devMenuInfo.appName,
          appVersion = devMenuInfo.appVersion
        )
      }

      return _applicationInfo!!
    }

  internal fun setUpUpdateInterface(updatesInterface: UpdatesInterface, context: Context) {
    val projectUrl = DevLauncherController.getMetadataValue(context, "expo.modules.updates.EXPO_UPDATE_URL")
    val projectUri = projectUrl.toUri()
    val appId = projectUri.lastPathSegment?.takeIf { it.isNotEmpty() }

    if (appId == null) {
      return
    }

    val devMenuInfo = AppInfo.native

    _applicationInfo = ApplicationInfo.Updates(
      appName = devMenuInfo.appName,
      appVersion = devMenuInfo.appVersion,
      appId = appId,
      runtimeVersion = updatesInterface.runtimeVersion,
      projectUrl = projectUrl
    )
  }
}
