package versioned.host.exp.exponent.modules.universal

import android.content.Context
import expo.modules.errorrecovery.ErrorRecoveryModule
import expo.modules.errorrecovery.RECOVERY_STORE
import host.exp.exponent.ExponentManifest
import host.exp.exponent.kernel.ExperienceId
import org.json.JSONObject
import org.unimodules.core.ModuleRegistry

class ScopedErrorRecoveryModule(context: Context, manifest: JSONObject, val experienceId: ExperienceId) : ErrorRecoveryModule(context) {
  private val mCurrentVersion = manifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY) ?: ""

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mSharedPreferences = context.applicationContext.getSharedPreferences("$RECOVERY_STORE.$mCurrentVersion", Context.MODE_PRIVATE)
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
