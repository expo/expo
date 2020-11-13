package expo.modules.notifications.serverregistration

import android.content.Context
import android.content.SharedPreferences

class LastRegistrationInfo(context: Context) {
  companion object {
    private const val PREFERENCES_NAME = "expo.modules.notifications.LastRegistrationInfo"

    private const val LAST_REGISTRATION_INFO_KEY = "lastRegistrationInfo"
  }

  private val sharedPreferences: SharedPreferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  fun get() =
    sharedPreferences.getString(LAST_REGISTRATION_INFO_KEY, null)

  fun set(lastRegistrationInfo: String?) {
    lastRegistrationInfo?.let {
      sharedPreferences.edit().putString(LAST_REGISTRATION_INFO_KEY, it).apply()
      return
    }
    sharedPreferences.edit().remove(LAST_REGISTRATION_INFO_KEY).apply()
  }
}
