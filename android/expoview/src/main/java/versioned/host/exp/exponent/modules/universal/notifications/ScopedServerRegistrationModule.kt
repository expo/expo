package versioned.host.exp.exponent.modules.universal.notifications

import expo.modules.notifications.serverregistration.ServerRegistrationModule
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.storage.ExponentSharedPreferences
import javax.inject.Inject

class ScopedServerRegistrationModule : ServerRegistrationModule() {
  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  override fun getInstallationId(): String {
    // If there is an existing installation ID, so if:
    // - we're in Expo Go and running an experience
    //   which has previously been run on an older SDK
    //   (where it persisted an installation ID in
    //   the legacy storage) or
    // we let the migration do its job of moving
    // expo-notifications-specific installation ID
    // from scoped SharedPreferences to scoped noBackupDir
    // and use it from now on.
    // Otherwise we can use the "common" installation ID
    // that has the benefit of being used if the project
    // is ejected to bare.
    val legacyUuid = installationId.uuid
    return legacyUuid ?: exponentSharedPreferences.getOrCreateUUID()
  }

  init {
    NativeModuleDepsProvider.instance.inject(ScopedServerRegistrationModule::class.java, this)
  }
}
