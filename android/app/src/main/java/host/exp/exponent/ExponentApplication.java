// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.os.Debug;
import android.support.multidex.MultiDexApplication;

import com.crashlytics.android.Crashlytics;
import com.crashlytics.android.core.CrashlyticsCore;
import com.crashlytics.android.core.CrashlyticsListener;
import com.facebook.react.bridge.ReactApplicationContext;

import javax.inject.Inject;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExponentKernelModuleInterface;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelInterface;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.modules.ExponentKernelModule;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;
import host.exp.expoview.ExpoViewBuildConfig;
import io.branch.referral.Branch;
import io.fabric.sdk.android.Fabric;
import me.leolin.shortcutbadger.ShortcutBadger;

public class ExponentApplication extends MultiDexApplication {

  static {
    ExpoViewBuildConfig.USE_INTERNET_KERNEL = BuildVariantConstants.USE_INTERNET_KERNEL;
    ExpoViewBuildConfig.DEBUG = BuildConfig.DEBUG;
  }

  private static final String TAG = ExponentApplication.class.getSimpleName();

  private static ExponentApplication sApplication;

  public static ExponentApplication getApplication() {
    return sApplication;
  }

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Override
  public void onCreate() {
    super.onCreate();

    KernelConstants.MAIN_ACTIVITY_CLASS = LauncherActivity.class;

    if (host.exp.expoview.BuildConfig.DEBUG && Constants.WAIT_FOR_DEBUGGER) {
      Debug.waitForDebugger();
    }

    Constants.setIsDetached(false);

    sApplication = this;

    KernelProvider.setFactory(new KernelProvider.KernelFactory() {
      @Override
      public KernelInterface create() {
        return new Kernel();
      }
    });

    ExponentKernelModuleProvider.setFactory(new ExponentKernelModuleProvider.ExponentKernelModuleFactory() {
      @Override
      public ExponentKernelModuleInterface create(ReactApplicationContext reactContext) {
        return new ExponentKernelModule(reactContext);
      }
    });

    Exponent.initialize(this, this);
    NativeModuleDepsProvider.getInstance().add(Kernel.class, KernelProvider.getInstance());
    Exponent.getInstance().setGCMSenderId(getString(R.string.gcm_defaultSenderId));
    
    NativeModuleDepsProvider.getInstance().inject(ExponentApplication.class, this);

    if (!BuildConfig.DEBUG) {
      final CrashlyticsListener listener = new CrashlyticsListener() {
        @Override
        public void crashlyticsDidDetectCrashDuringPreviousExecution(){
          mExponentSharedPreferences.setBoolean(ExponentSharedPreferences.SHOULD_NOT_USE_KERNEL_CACHE, true);
        }
      };

      final CrashlyticsCore core = new CrashlyticsCore
          .Builder()
          .listener(listener)
          .build();

      Fabric.with(this, new Crashlytics.Builder().core(core).build());

      try {
        String versionName = Constants.getVersionName(this);
        Crashlytics.setString("exp_client_version", versionName);
      } catch (Throwable e) {
        EXL.e(TAG, e.toString());
      }
    }

    Branch.getAutoInstance(this);

    try {
      // Remove the badge count on weird launchers
      // TODO: doesn't work on the Xiaomi phone. bug with the library
      ShortcutBadger.removeCount(this);
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }
}
