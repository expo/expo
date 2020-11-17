package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import org.unimodules.core.Promise;

import javax.inject.Inject;

import expo.modules.notifications.installationid.InstallationIdProvider;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ScopedInstallationIdProvider extends InstallationIdProvider {
  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public ScopedInstallationIdProvider(Context context) {
    super(context);
    NativeModuleDepsProvider.getInstance().inject(ScopedInstallationIdProvider.class, this);
  }

  @Override
  public void getInstallationIdAsync(Promise promise) {
    // If there is an existing installation ID, so if:
    // - we're in Expo client and running an experience
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
    String legacyUuid = mInstallationId.getUUID();
    if (legacyUuid != null) {
      promise.resolve(legacyUuid);
    } else {
      // Otherwise we can use the "common" installation ID
      // that has the benefit of being used if the project
      // is ejected to bare.
      promise.resolve(mExponentSharedPreferences.getOrCreateUUID());
    }
  }
}
