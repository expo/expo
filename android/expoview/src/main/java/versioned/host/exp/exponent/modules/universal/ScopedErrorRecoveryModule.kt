package versioned.host.exp.exponent.modules.universal

import android.content.Context
import android.content.SharedPreferences
import expo.modules.errorrecovery.ErrorRecoveryModule
import expo.modules.errorrecovery.RECOVERY_STORE
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExperienceKey

class ScopedErrorRecoveryModule(
  context: Context,
  manifest: Manifest,
  val experienceKey: ExperienceKey
) : ErrorRecoveryModule(context) {
  override val mSharedPreferences: SharedPreferences = run {
    val currentSDKVersion = manifest.getSDKVersion()
    context.applicationContext.getSharedPreferences(
      "$RECOVERY_STORE.$currentSDKVersion",
      Context.MODE_PRIVATE
    )
  }

  override fun setRecoveryProps(props: String) {
    mSharedPreferences.edit().putString(experienceKey.scopeKey, props).commit()
  }

  override fun consumeRecoveryProps(): String? {
    return mSharedPreferences.getString(experienceKey.scopeKey, null)?.let {
      mSharedPreferences.edit().remove(experienceKey.scopeKey).commit()
      it
    }
  }
}
