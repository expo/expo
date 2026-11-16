package host.exp.exponent.services

import android.content.Context
import androidx.core.content.edit

enum class ThemeSetting {
  Automatic,
  Light,
  Dark
}

class SessionRepository(private val context: Context) {
  private val sharedPreferences = context.getSharedPreferences(
    "expo_session",
    Context.MODE_PRIVATE
  )

  val sessionStore: SessionStore
    get() = SessionStore.getInstance(context)

  fun getActiveSessionSecret(): String? = sessionStore.activeSession?.sessionSecret

  companion object {
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
}
