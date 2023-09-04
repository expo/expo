package versioned.host.exp.exponent.modules.universal

import android.content.Context
import host.exp.exponent.utils.ScopedContext
import android.content.SharedPreferences
import android.util.Log
import expo.modules.securestore.SecureStoreModule
import host.exp.exponent.Constants

class ScopedSecureStoreModule(scopedContext: ScopedContext) : SecureStoreModule() {
  override var reactContext: Context = scopedContext
}
