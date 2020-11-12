package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import org.unimodules.core.Promise;

import javax.inject.Inject;

import expo.modules.notifications.installationid.InstallationIdProvider;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;
import versioned.host.exp.exponent.modules.universal.ConstantsBinding;

public class ScopedInstallationIdProvider extends InstallationIdProvider {
  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public ScopedInstallationIdProvider(Context context) {
    super(context);
    NativeModuleDepsProvider.getInstance().inject(ScopedInstallationIdProvider.class, this);
  }

  @Override
  public void getInstallationIdAsync(Promise promise) {
    promise.resolve(mExponentSharedPreferences.getOrCreateUUID());
  }
}
