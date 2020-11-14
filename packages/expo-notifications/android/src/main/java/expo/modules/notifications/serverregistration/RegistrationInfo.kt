package expo.modules.notifications.serverregistration

import android.content.Context
import android.content.SharedPreferences

class RegistrationInfo(context: Context) {
  companion object {
    private const val PREFERENCES_NAME = "expo.modules.notifications.RegistrationInfo"

    private const val REGISTRATION_INFO_KEY = "registrationInfo"
  }

  private val sharedPreferences: SharedPreferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  fun get() =
    sharedPreferences.getString(REGISTRATION_INFO_KEY, null)

  fun set(registrationInfo: String?) {
    registrationInfo?.let {
      sharedPreferences.edit().putString(REGISTRATION_INFO_KEY, it).apply()
      return
    }
    sharedPreferences.edit().remove(REGISTRATION_INFO_KEY).apply()
  }
}
