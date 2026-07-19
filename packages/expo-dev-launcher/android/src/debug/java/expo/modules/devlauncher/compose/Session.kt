package expo.modules.devlauncher.compose

import android.content.SharedPreferences
import org.json.JSONObject
import androidx.core.content.edit

data class Session(
  val sessionSecret: String
) {
  val token: String
    get() = JSONObject(sessionSecret).getString("id")

  val version: Int
    get() = JSONObject(sessionSecret).getInt("version")

  val expiresAt: Long
    get() = JSONObject(sessionSecret).getLong("expires_at")

  companion object {
    fun loadFromPreferences(preferences: SharedPreferences): Session? {
      val sessionSecret = preferences.getString("session_secret", null) ?: return null
      return Session(sessionSecret)
    }
  }
}

fun Session?.saveToPreferences(preferences: SharedPreferences) {
  if (this == null) {
    preferences.edit(commit = true) { remove("session_secret") }
  } else {
    preferences.edit(commit = true) { putString("session_secret", sessionSecret) }
  }
}
