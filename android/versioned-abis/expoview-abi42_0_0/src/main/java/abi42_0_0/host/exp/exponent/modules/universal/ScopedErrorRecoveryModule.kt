package abi42_0_0.host.exp.exponent.modules.universal

import android.content.Context
import android.content.SharedPreferences
import abi42_0_0.expo.modules.errorrecovery.ErrorRecoveryModule
import abi42_0_0.expo.modules.errorrecovery.RECOVERY_STORE
import expo.modules.updates.manifest.raw.RawManifest
import host.exp.exponent.kernel.ExperienceId

class ScopedErrorRecoveryModule(
  context: Context,
  manifest: RawManifest,
  val experienceId: ExperienceId
) : ErrorRecoveryModule(context) {
  override val mSharedPreferences: SharedPreferences = run {
    val currentSDKVersion = manifest.getSDKVersionNullable()
    context.applicationContext.getSharedPreferences(
        "$RECOVERY_STORE.$currentSDKVersion",
        Context.MODE_PRIVATE
    )
  }

  override fun setRecoveryProps(props: String) {
    mSharedPreferences.edit().putString(experienceId.get(), props).commit()
  }

  override fun consumeRecoveryProps(): String? {
    return mSharedPreferences.getString(experienceId.get(), null)?.let {
      mSharedPreferences.edit().remove(experienceId.get()).commit()
      it
    }
  }
}
