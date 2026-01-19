package host.exp.exponent.experience

import android.app.Application
import expo.modules.devmenu.DevMenuDefaultPreferences
import expo.modules.devmenu.DevMenuPreferences
import host.exp.exponent.storage.ExponentSharedPreferences

class DevMenuSharedPreferencesAdapter(
  application: Application,
  val exponentSharedPreferences: ExponentSharedPreferences,
  val devMenuSharedPreferences: DevMenuPreferences = DevMenuDefaultPreferences(application)
) : DevMenuPreferences by devMenuSharedPreferences {
  override var isOnboardingFinished: Boolean
    get() = exponentSharedPreferences
      .getBoolean(ExponentSharedPreferences.ExponentSharedPreferencesKey.IS_ONBOARDING_FINISHED_KEY)
    set(value) {
      exponentSharedPreferences.setBoolean(
        ExponentSharedPreferences.ExponentSharedPreferencesKey.IS_ONBOARDING_FINISHED_KEY,
        value
      )
    }
}
