package expo.modules.developmentclient.launcher

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson

private const val RECENTLY_OPENED_APPS_SHARED_PREFERENCES = "expo.modules.developmentclient.recentyopenedapps"

private const val TIME_TO_REMOVE = 60 * 60 * 24 * 3 // 3 days

data class DevelopmentClientAppEntry(
  val timestamp: Long,
  val name: String?
)

class DevelopmentClientRecentlyOpenedAppsRegistry(private val context: Context) {
  private val sharedPreferences: SharedPreferences = context.getSharedPreferences(RECENTLY_OPENED_APPS_SHARED_PREFERENCES, Context.MODE_PRIVATE)

  fun appWasOpened(url: String, name: String?) {
    sharedPreferences
      .edit()
      .putString(url, Gson().toJson(DevelopmentClientAppEntry(System.currentTimeMillis(), name)))
      .apply()
  }

  fun getRecentlyOpenedApps(): Map<String, String?> {
    val result = mutableMapOf<String, String?>()
    val toRemove = mutableListOf<String>()
    val gson = Gson()
    sharedPreferences.all.forEach { (url, appEntryString) ->
      val appEntry = gson.fromJson(appEntryString as String, DevelopmentClientAppEntry::class.java)
      if (System.currentTimeMillis() - appEntry.timestamp > TIME_TO_REMOVE) {
        toRemove.add(url)
        return@forEach
      }

      result[url] = appEntry.name
    }

    sharedPreferences.edit().apply {
      toRemove.forEach {
        remove(it)
      }
    }.apply()

    return result
  }
}
