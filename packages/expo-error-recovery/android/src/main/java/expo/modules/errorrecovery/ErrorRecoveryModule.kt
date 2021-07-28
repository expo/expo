package expo.modules.errorrecovery

import android.content.Context
import android.content.SharedPreferences

import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod

const val RECOVERY_STORE = "expo.modules.errorrecovery.store"
private const val RECOVERY_STORE_KEY = "recoveredProps"

open class ErrorRecoveryModule(context: Context) : ExportedModule(context) {
  protected open val mSharedPreferences: SharedPreferences = context.applicationContext.getSharedPreferences(RECOVERY_STORE, Context.MODE_PRIVATE)

  override fun getName(): String = "ExpoErrorRecovery"

  @ExpoMethod
  fun saveRecoveryProps(props: String?, promise: Promise) {
    props?.let {
      setRecoveryProps(it)
    }
    promise.resolve(null)
  }

  override fun getConstants(): Map<String, Any?> {
    return mapOf(RECOVERY_STORE_KEY to consumeRecoveryProps())
  }

  protected open fun setRecoveryProps(props: String) {
    mSharedPreferences.edit().putString(RECOVERY_STORE_KEY, props).commit()
  }

  protected open fun consumeRecoveryProps(): String? {
    return mSharedPreferences.getString(RECOVERY_STORE_KEY, null)?.let {
      mSharedPreferences.edit().remove(RECOVERY_STORE_KEY).commit()
      it
    }
  }
}
