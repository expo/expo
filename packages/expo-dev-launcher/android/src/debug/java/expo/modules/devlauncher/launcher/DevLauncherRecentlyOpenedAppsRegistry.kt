package expo.modules.devlauncher.launcher

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import androidx.core.net.toUri
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import expo.modules.manifests.core.Manifest

private const val RECENTLY_OPENED_APPS_SHARED_PREFERENCES = "expo.modules.devlauncher.recentyopenedapps"

private const val TIME_TO_REMOVE = 1000 * 60 * 60 * 24 * 3 // 3 days

data class DevLauncherAppEntry(
  val timestamp: Long,
  val name: String?,
  val url: String,
  val isEASUpdate: Boolean?,
  val updateMessage: String?,
  val branchName: String?
)

class DevLauncherRecentlyOpenedAppsRegistry(context: Context) {
  private val sharedPreferences: SharedPreferences = context.getSharedPreferences(RECENTLY_OPENED_APPS_SHARED_PREFERENCES, Context.MODE_PRIVATE)

  fun appWasOpened(url: String, queryParams: Map<String, String>, manifest: Manifest?) {
    var appEntry = mutableMapOf<String, Any>()
    val uri = url.toUri()

    if (sharedPreferences.contains(url)) {
      val previousEntryJsonString = sharedPreferences.getString(url, null)
      val type = object : TypeToken<Map<String, Any>>() {}.type
      val previousEntry: Map<String, Any> = Gson().fromJson(previousEntryJsonString, type)
      appEntry = previousEntry.toMutableMap()
    }

    val timestamp = TimeHelper.getCurrentTime()

    val isEASUpdate = uri.host === "u.expo.dev" || uri.host == "staging-u.expo.dev"
    appEntry["isEASUpdate"] = isEASUpdate

    if (isEASUpdate) {
      if (queryParams["updateMessage"] != null) {
        appEntry["updateMessage"] = queryParams["updateMessage"] as String
      }
    }

    if (manifest != null) {
      appEntry["name"] = manifest.getName() as String

      if (isEASUpdate) {
        val metadata = manifest.getMetadata()
        appEntry["branchName"] = metadata?.get("branchName") ?: ""
      }
    }

    appEntry["timestamp"] = timestamp
    appEntry["url"] = url

    sharedPreferences
      .edit(commit = true) {
        putString(url, Gson().toJson(appEntry))
      }
  }

  fun getRecentlyOpenedApps(): List<DevLauncherAppEntry> {
    val result = mutableListOf<DevLauncherAppEntry>()
    val toRemove = mutableListOf<String>()
    val gson = Gson()

    sharedPreferences.all.forEach { (url, appEntryString) ->
      val appEntry = gson.fromJson(appEntryString as String, DevLauncherAppEntry::class.java)
      if (TimeHelper.getCurrentTime() - appEntry.timestamp > TIME_TO_REMOVE) {
        toRemove.add(url)
        return@forEach
      }

      result.add(appEntry)
    }

    sharedPreferences.edit(commit = true) {
      toRemove.forEach {
        remove(it)
      }
    }

    return result
  }

  fun getMostRecentApp(): DevLauncherAppEntry? {
    val recentlyOpenedApps = getRecentlyOpenedApps()

    return if (recentlyOpenedApps.isNotEmpty()) {
      recentlyOpenedApps.maxByOrNull { it.timestamp }
    } else {
      null
    }
  }

  fun clearRegistry() {
    sharedPreferences.edit(commit = true) { clear() }
  }

  object TimeHelper {
    fun getCurrentTime() = System.currentTimeMillis()
  }
}
