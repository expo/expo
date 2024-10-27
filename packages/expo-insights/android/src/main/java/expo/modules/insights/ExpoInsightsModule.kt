package expo.modules.insights

import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log
import expo.modules.easclient.EASClientID
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Indicates whether the app launch event has already been sent.
 */
private var wasAppLauncherEventDispatched = false

private const val APP_LAUNCH_EVENT = "APP_LAUNCH"

class ExpoInsightsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoInsights")

    OnCreate {
      if (!wasAppLauncherEventDispatched) {
        wasAppLauncherEventDispatched = true

        appContext.modulesQueue.launch {
          dispatchLaunchEvent()
        }
      }
    }
  }

  /**
   * Sends the [APP_LAUNCH_EVENT] event.
   */
  private suspend fun dispatchLaunchEvent() {
    val manifestString = appContext.constants?.constants?.get("manifest") as? String
    if (manifestString.isNullOrEmpty()) {
      Log.w("ExpoInsights", "Unable to read the manifest")
      return
    }
    val manifest = JSONObject(manifestString)
    val projectId = getProjectId(manifest)
    if (projectId.isNullOrEmpty()) {
      Log.w("ExpoInsights", "Unable to get the project ID")
      return
    }

    val data = getLaunchEventData(projectId)
    dispatchEvent(projectId, APP_LAUNCH_EVENT, data)
  }

  /**
   * Sends an event with the given name and data.
   */
  private suspend fun dispatchEvent(projectId: String, eventName: String, data: Map<String, String?>) {
    val endpointUrl = Uri
      .parse("https://i.expo.dev/v1/c/$projectId")
      .buildUpon()
      .apply {
        data.forEach { (key, value) ->
          if (value != null) {
            appendQueryParameter(key, value)
          }
        }
      }
      .build()

    withContext(Dispatchers.IO) {
      val responseCode = try {
        val url = URL(endpointUrl.toString())
        val connection = url.openConnection() as HttpURLConnection
        val responseCode = connection.responseCode
        connection.disconnect()
        responseCode
      } catch (e: Throwable) {
        Log.w("ExpoInsights", "Unable to send a request to the server", e)
        return@withContext
      }

      if (!(200..299).contains(responseCode)) {
        Log.w("ExpoInsights", "Server responded with status code $responseCode for event $eventName")
      }
      Log.w("ExpoInsights", "Status code $responseCode")
    }
  }

  /**
   * Gets the project ID from the manifest.
   */
  private fun getProjectId(manifest: JSONObject): String? {
    val extra = manifest.optJSONObject("extra")
    val eas = extra?.optJSONObject("eas")
    return eas?.optString("projectId")
  }

  /**
   * Returns the data necessary for [APP_LAUNCH_EVENT] event.
   */
  private fun getLaunchEventData(projectId: String): Map<String, String?> {
    return mapOf(
      "event_name" to APP_LAUNCH_EVENT,
      "eas_client_id" to getEASClientId(),
      "project_id" to projectId,
      "app_version" to getAppVersion(),
      "platform" to "android",
      "os_version" to Build.VERSION.SDK_INT.toString()
    )
  }

  /**
   * Gets the app version from the package manager.
   */
  private fun getAppVersion(): String? {
    val reactContext = appContext.reactContext ?: return null
    return try {
      val pInfo: PackageInfo = reactContext.packageManager.getPackageInfoCompat(reactContext.packageName, 0)
      pInfo.versionName
    } catch (e: PackageManager.NameNotFoundException) {
      null
    }
  }

  /**
   * Gets the EAS client Id.
   */
  private fun getEASClientId(): String? {
    val reactContext = appContext.reactContext ?: return null
    return EASClientID(reactContext).uuid.toString()
  }
}

private fun PackageManager.getPackageInfoCompat(packageName: String, flags: Int = 0): PackageInfo =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(flags.toLong()))
  } else {
    @Suppress("DEPRECATION")
    getPackageInfo(packageName, flags)
  }
