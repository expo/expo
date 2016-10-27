// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.support.multidex.MultiDexApplication;

import com.crashlytics.android.Crashlytics;

import host.exp.exponent.analytics.EXL;
import host.exp.exponentview.Exponent;
import host.exp.exponentview.ExponentViewBuildConfig;
import io.fabric.sdk.android.Fabric;
import me.leolin.shortcutbadger.ShortcutBadger;

public class ExponentApplication extends MultiDexApplication {

  static {
    ExponentViewBuildConfig.USE_INTERNET_KERNEL = BuildVariantConstants.USE_INTERNET_KERNEL;
  }

  private static final String TAG = ExponentApplication.class.getSimpleName();

  private static ExponentApplication sApplication;

  public static ExponentApplication getApplication() {
    return sApplication;
  }

  @Override
  public void onCreate() {
    super.onCreate();

    if (!BuildConfig.DEBUG) {
      Fabric.with(this, new Crashlytics());

      try {
        String versionName = Constants.getVersionName(this);
        Crashlytics.setString("exp_client_version", versionName);
      } catch (Throwable e) {
        EXL.e(TAG, e.toString());
      }
    }

    sApplication = this;
    Exponent.initialize(this, this);
    Exponent.getInstance().setGCMSenderId(getString(R.string.gcm_defaultSenderId));

    try {
      // Remove the badge count on weird launchers
      // TODO: doesn't work on the Xiaomi phone. bug with the library
      ShortcutBadger.removeCount(this);
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }
}
