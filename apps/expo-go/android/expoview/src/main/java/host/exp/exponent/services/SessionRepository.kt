package host.exp.exponent.services

import android.content.Context
import androidx.core.content.edit

enum class ThemeSetting {
  Automatic,
  Light,
  Dark
}

class SessionRepository(context: Context) {
  private val sharedPreferences = context.getSharedPreferences(
    "expo_session",
    Context.MODE_PRIVATE
  )

  companion object {
    private const val SESSION_SECRET_KEY = "session_secret"
    private const val SELECTED_ACCOUNT_ID_KEY = "selected_account_id"
    private const val RECENTS_KEY = "recents_history"
    private const val THEME_KEY = "theme"
  }

  fun saveThemeSetting(themeSetting: ThemeSetting) {
    sharedPreferences.edit(commit = true) {
      putString(THEME_KEY, themeSetting.name)
    }
  }

  fun getThemeSetting(): ThemeSetting {
    val themeName = sharedPreferences.getString(THEME_KEY, ThemeSetting.Automatic.name)
    return try {
      ThemeSetting.valueOf(themeName ?: ThemeSetting.Automatic.name)
    } catch (_: IllegalArgumentException) {
      ThemeSetting.Automatic
    }
  }

  fun saveSessionSecret(secret: String?) {
    sharedPreferences.edit(commit = true) {
      putString(SESSION_SECRET_KEY, secret)
    }
  }

  fun getSessionSecret(): String? {
    return sharedPreferences.getString(SESSION_SECRET_KEY, null)
  }

  fun clearSessionSecret() {
    sharedPreferences.edit(commit = true) {
      remove(SESSION_SECRET_KEY)
    }
  }

  fun saveSelectedAccountId(accountId: String?) {
    sharedPreferences.edit(commit = true) {
      putString(SELECTED_ACCOUNT_ID_KEY, accountId)
    }
  }

  fun clearSelectedAccountId() {
    sharedPreferences.edit(commit = true) {
      remove(SELECTED_ACCOUNT_ID_KEY)
    }
  }

  fun getSelectedAccountId(): String? {
    return sharedPreferences.getString(SELECTED_ACCOUNT_ID_KEY, null)
  }
}
