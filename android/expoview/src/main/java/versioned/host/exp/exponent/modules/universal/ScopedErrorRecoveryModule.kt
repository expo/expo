package versioned.host.exp.exponent.modules.universal

import android.content.Context
import expo.modules.errorrecovery.ErrorRecoveryModule
import host.exp.exponent.kernel.ExperienceId

class ScopedErrorRecoveryModule(context: Context, val experienceId: ExperienceId) : ErrorRecoveryModule(context) {
  override fun pushProps(props: String) {
    mSharedPreferences.edit().putString(experienceId.get(), props).apply()
  }

  override fun popProps(): Map<String, Any> {
    with(mSharedPreferences.getString(experienceId.get(), "")) {
      return if (isNotEmpty()) {
        mSharedPreferences.edit().remove(experienceId.get()).apply()
        getPropsFromString(this)
      } else {
        emptyMap()
      }
    }
  }
}
