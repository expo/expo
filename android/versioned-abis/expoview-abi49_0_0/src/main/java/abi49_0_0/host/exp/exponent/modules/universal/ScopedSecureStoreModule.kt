package abi49_0_0.host.exp.exponent.modules.universal

import android.content.Context
import host.exp.exponent.utils.ScopedContext
import android.content.SharedPreferences
import abi49_0_0.expo.modules.securestore.SecureStoreModule

private const val SHARED_PREFERENCES_NAME = "SecureStore"

class ScopedSecureStoreModule(private val scopedContext: ScopedContext) :
  SecureStoreModule(scopedContext) {

  private val scopedSharedPreferences: SharedPreferences
    get() = scopedContext.getSharedPreferences(
      SHARED_PREFERENCES_NAME,
      Context.MODE_PRIVATE
    )
}
