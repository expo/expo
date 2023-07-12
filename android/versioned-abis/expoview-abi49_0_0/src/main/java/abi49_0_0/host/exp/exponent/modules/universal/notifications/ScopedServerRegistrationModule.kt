package abi49_0_0.host.exp.exponent.modules.universal.notifications

import android.content.Context
import abi49_0_0.expo.modules.core.Promise
import abi49_0_0.expo.modules.notifications.serverregistration.ServerRegistrationModule
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.storage.ExponentSharedPreferences
import javax.inject.Inject

class ScopedServerRegistrationModule(context: Context) : ServerRegistrationModule(context) {
  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  override fun getInstallationIdAsync(promise: Promise) {
    // If there is an existing installation ID, so if:
    // - we're in Expo Go and running an experience
    //   which has previously been run on an older SDK
    //   (where it persisted an installation ID in
    //   the legacy storage) or
    // - we're in a standalone app after update
    //   from SDK where installation ID has been
    //   persisted in legacy storage
    // we let the migration do its job of moving
    // expo-notifications-specific installation ID
    // from scoped SharedPreferences to scoped noBackupDir
    // and use it from now on.
    val legacyUuid = mInstallationId.uuid
    if (legacyUuid != null) {
      promise.resolve(legacyUuid)
    } else {
      // Otherwise we can use the "common" installation ID
      // that has the benefit of being used if the project
      // is ejected to bare.
      promise.resolve(exponentSharedPreferences.getOrCreateUUID())
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ScopedServerRegistrationModule::class.java, this)
  }
}
