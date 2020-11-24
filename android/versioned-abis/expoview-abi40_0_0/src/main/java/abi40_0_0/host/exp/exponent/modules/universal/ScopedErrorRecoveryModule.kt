package abi40_0_0.host.exp.exponent.modules.universal

import android.content.Context
import android.content.SharedPreferences
import abi40_0_0.expo.modules.errorrecovery.ErrorRecoveryModule
import abi40_0_0.expo.modules.errorrecovery.RECOVERY_STORE
import host.exp.exponent.ExponentManifest
import host.exp.exponent.kernel.ExperienceId
import org.json.JSONObject

class ScopedErrorRecoveryModule(context: Context, manifest: JSONObject,
                                val experienceId: ExperienceId) : ErrorRecoveryModule(context) {
  override val mSharedPreferences: SharedPreferences = run {
    val currentSDKVersion = manifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY)
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
