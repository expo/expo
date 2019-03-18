// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.os.Debug;
import android.support.multidex.MultiDexApplication;

import com.crashlytics.android.Crashlytics;
import com.crashlytics.android.core.CrashlyticsCore;
import com.crashlytics.android.core.CrashlyticsListener;
import com.facebook.ads.AudienceNetworkAds;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.soloader.SoLoader;

import javax.inject.Inject;

import expo.loaders.provider.AppLoaderProvider;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.branch.BranchManager;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExponentKernelModuleInterface;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelInterface;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.headless.HeadlessAppLoader;
import host.exp.exponent.modules.ExponentKernelModule;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;
import host.exp.expoview.ExpoViewBuildConfig;
import io.fabric.sdk.android.Fabric;
import me.leolin.shortcutbadger.ShortcutBadger;

public abstract class ExpoApplication extends MultiDexApplication {

  // Override me!
  public abstract String gcmSenderId();
  public abstract boolean isDebug();

  private static final String TAG = ExpoApplication.class.getSimpleName();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Override
  public void onCreate() {
    super.onCreate();

    ExpoViewBuildConfig.DEBUG = isDebug();
    ExpoViewBuildConfig.USE_INTERNET_KERNEL = shouldUseInternetKernel();

    if (ExpoViewBuildConfig.DEBUG && Constants.WAIT_FOR_DEBUGGER) {
      Debug.waitForDebugger();
    }

    if (!Constants.isStandaloneApp()) {
      KernelConstants.MAIN_ACTIVITY_CLASS = LauncherActivity.class;
    }

    AppLoaderProvider.registerLoader("react-native-experience", HeadlessAppLoader.class);
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
    Exponent.getInstance().setGCMSenderId(gcmSenderId());
    
    NativeModuleDepsProvider.getInstance().inject(ExpoApplication.class, this);

    if (!ExpoViewBuildConfig.DEBUG) {
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
        if (Constants.INITIAL_URL != null) {
          Crashlytics.setString("initial_url", Constants.INITIAL_URL);
        }
      } catch (Throwable e) {
        EXL.e(TAG, e.toString());
      }
    }

    BranchManager.initialize(this);
    AudienceNetworkAds.initialize(this);

    try {
      // Remove the badge count on weird launchers
      // TODO: doesn't work on the Xiaomi phone. bug with the library
      ShortcutBadger.removeCount(this);
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }

    if (Constants.DEBUG_COLD_START_METHOD_TRACING) {
      Debug.startMethodTracing("coldStart");
    }

    Analytics.markEvent(Analytics.TimedEvent.LAUNCHER_ACTIVITY_STARTED);

    SoLoader.init(getApplicationContext(), false);


    // Add exception handler. This is used by the entire process, so only need to add it here.
    Thread.setDefaultUncaughtExceptionHandler(new ExponentUncaughtExceptionHandler(getApplicationContext()));
  }

  // we're leaving this stub in here so that if people don't modify their MainApplication to
  // remove the override of shouldUseInternetKernel() their project will still build without errors
  public boolean shouldUseInternetKernel() {
    return !isDebug();
  }
}
