package host.exp.exponent.services

import android.content.Context
import android.net.Uri
import androidx.core.content.edit
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

enum class ThemeSetting {
  Automatic,
  Light,
  Dark
}

//TODO: Rename
class SessionRepository(context: Context) {
  private val sharedPreferences = context.getSharedPreferences("expo_session", Context.MODE_PRIVATE)

  companion object {
    private const val SESSION_SECRET_KEY = "session_secret"
    private const val SELECTED_ACCOUNT_ID_KEY = "selected_account_id"
    private const val RECENTS_KEY = "recents_history"
    private const val THEME_KEY = "theme"
  }

  fun saveThemeSetting(themeSetting: ThemeSetting) {
    sharedPreferences.edit().putString(THEME_KEY, themeSetting.name).apply()
  }

  fun getThemeSetting(): ThemeSetting {
    val themeName = sharedPreferences.getString(THEME_KEY, ThemeSetting.Automatic.name)
    return try {
      ThemeSetting.valueOf(themeName ?: ThemeSetting.Automatic.name)
    } catch (e: IllegalArgumentException) {
      ThemeSetting.Automatic
    }
  }

  fun saveSessionSecret(secret: String?) {
    sharedPreferences.edit().putString(SESSION_SECRET_KEY, secret).apply()
  }

  fun getSessionSecret(): String? {
    return sharedPreferences.getString(SESSION_SECRET_KEY, null)
  }

  fun clearSessionSecret() {
    sharedPreferences.edit().remove(SESSION_SECRET_KEY).apply()
  }

  fun saveSelectedAccountId(accountId: String?) {
    sharedPreferences.edit().putString(SELECTED_ACCOUNT_ID_KEY, accountId).apply()
  }

  fun clearSelectedAccountId() {
    sharedPreferences.edit().remove(SELECTED_ACCOUNT_ID_KEY).apply()
  }

  fun getSelectedAccountId(): String? {
    return sharedPreferences.getString(SELECTED_ACCOUNT_ID_KEY, null)
  }

  fun saveRecents(recents: List<HistoryItem>) {
    val json = Gson().toJson(recents)
    sharedPreferences.edit {
      putString(RECENTS_KEY, json)
    }
  }

  fun getRecents(): List<HistoryItem> {
    val json = sharedPreferences.getString(RECENTS_KEY, null)
    if (json.isNullOrBlank()) {
      return emptyList()
    }
    val type = object : TypeToken<List<HistoryItem>>() {}.type
    return Gson().fromJson(json, type)
  }
}
