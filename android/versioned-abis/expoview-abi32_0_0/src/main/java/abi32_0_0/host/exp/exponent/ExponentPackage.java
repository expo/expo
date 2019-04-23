// Copyright 2015-present 650 Industries. All rights reserved.

package abi32_0_0.host.exp.exponent;

import android.content.Context;
import android.os.Looper;

import abi32_0_0.com.facebook.react.ReactPackage;
import abi32_0_0.com.facebook.react.bridge.NativeModule;
import abi32_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi32_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import abi32_0_0.expo.adapters.react.ReactModuleRegistryProvider;
import abi32_0_0.expo.core.interfaces.Package;
import org.unimodules.core.interfaces.SingletonModule;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;
import abi32_0_0.host.exp.exponent.modules.api.SplashScreenModule;
import abi32_0_0.host.exp.exponent.modules.api.BrightnessModule;
import abi32_0_0.host.exp.exponent.modules.api.ImageManipulatorModule;
import abi32_0_0.host.exp.exponent.modules.api.MailComposerModule;
import abi32_0_0.host.exp.exponent.modules.api.PedometerModule;
import abi32_0_0.host.exp.exponent.modules.api.UpdatesModule;
import abi32_0_0.host.exp.exponent.modules.api.av.video.VideoManager;
import abi32_0_0.host.exp.exponent.modules.api.fbads.AdIconViewManager;
import abi32_0_0.host.exp.exponent.modules.api.fbads.MediaViewManager;
import abi32_0_0.host.exp.exponent.modules.api.AmplitudeModule;
import abi32_0_0.host.exp.exponent.modules.api.CalendarModule;
import abi32_0_0.host.exp.exponent.modules.api.DocumentPickerModule;
import abi32_0_0.host.exp.exponent.modules.api.ErrorRecoveryModule;
import abi32_0_0.host.exp.exponent.modules.api.FacebookModule;
import abi32_0_0.host.exp.exponent.modules.api.ImagePickerModule;
import abi32_0_0.host.exp.exponent.modules.api.KeepAwakeModule;
import abi32_0_0.host.exp.exponent.modules.api.KeyboardModule;
import abi32_0_0.host.exp.exponent.modules.api.notifications.NotificationsModule;
import abi32_0_0.host.exp.exponent.modules.api.viewshot.RNViewShotModule;
import abi32_0_0.host.exp.exponent.modules.api.SQLiteModule;
import abi32_0_0.host.exp.exponent.modules.api.ScreenOrientationModule;
import abi32_0_0.host.exp.exponent.modules.api.screens.RNScreensPackage;
import abi32_0_0.host.exp.exponent.modules.api.ShakeModule;
import abi32_0_0.host.exp.exponent.modules.api.SpeechModule;
import abi32_0_0.host.exp.exponent.modules.api.URLHandlerModule;
import abi32_0_0.host.exp.exponent.modules.api.WebBrowserModule;
import abi32_0_0.host.exp.exponent.modules.api.av.AVModule;
import abi32_0_0.host.exp.exponent.modules.api.av.video.VideoViewManager;
import abi32_0_0.host.exp.exponent.modules.api.cognito.RNAWSCognitoModule;
import abi32_0_0.host.exp.exponent.modules.api.components.LinearGradientManager;
import abi32_0_0.host.exp.exponent.modules.api.components.lottie.LottiePackage;
import abi32_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerPackage;
import abi32_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule;
import abi32_0_0.host.exp.exponent.modules.api.components.maps.MapsPackage;
import abi32_0_0.host.exp.exponent.modules.api.components.svg.SvgPackage;
import abi32_0_0.host.exp.exponent.modules.api.fbads.AdSettingsManager;
import abi32_0_0.host.exp.exponent.modules.api.fbads.BannerViewManager;
import abi32_0_0.host.exp.exponent.modules.api.fbads.InterstitialAdManager;
import abi32_0_0.host.exp.exponent.modules.api.fbads.NativeAdManager;
import abi32_0_0.host.exp.exponent.modules.api.fbads.NativeAdViewManager;
import abi32_0_0.host.exp.exponent.modules.api.IntentLauncherModule;
import abi32_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedModule;
import abi32_0_0.host.exp.exponent.modules.api.SecureStoreModule;
import abi32_0_0.host.exp.exponent.modules.api.standalone.branch.RNBranchModule;
import abi32_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi32_0_0.host.exp.exponent.modules.internal.ExponentIntentModule;
import abi32_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;
import abi32_0_0.host.exp.exponent.modules.test.ExponentTestNativeModule;
import abi32_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;
import abi32_0_0.host.exp.exponent.modules.universal.ScopedModuleRegistryAdapter;

import static host.exp.exponent.kernel.KernelConstants.IS_HEADLESS_KEY;
import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;

public class ExponentPackage implements ReactPackage {
  private static final String TAG = ExponentPackage.class.getSimpleName();
  private static List<SingletonModule> sSingletonModules;

  private final boolean mIsKernel;
  private final Map<String, Object> mExperienceProperties;
  private final JSONObject mManifest;

  private final ScopedModuleRegistryAdapter mModuleRegistryAdapter;

  private ExponentPackage(boolean isKernel, Map<String, Object> experienceProperties, JSONObject manifest, List<Package> expoPackages, List<SingletonModule> singletonModules) {
    mIsKernel = isKernel;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
    mModuleRegistryAdapter = createDefaultModuleRegistryAdapterForPackages(expoPackages, singletonModules);
  }

  public ExponentPackage(Map<String, Object> experienceProperties, JSONObject manifest, List<Package> expoPackages, ExponentPackageDelegate delegate, List<SingletonModule> singletonModules) {
    mIsKernel = false;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;

    List<Package> packages = expoPackages;
    if (packages == null) {
       packages = ExperiencePackagePicker.packages(manifest);
    }
    // Delegate may not be null only when the app is detached
    if (delegate != null) {
      mModuleRegistryAdapter = delegate.getScopedModuleRegistryAdapterForPackages(packages, singletonModules);
    } else {
      mModuleRegistryAdapter = createDefaultModuleRegistryAdapterForPackages(packages, singletonModules);
    }
  }

  public static ExponentPackage kernelExponentPackage(Context context, JSONObject manifest, List<Package> expoPackages) {
    Map<String, Object> kernelExperienceProperties = new HashMap<>();
    List<SingletonModule> singletonModules = ExponentPackage.getOrCreateSingletonModules(context);
    kernelExperienceProperties.put(LINKING_URI_KEY, "exp://");
    kernelExperienceProperties.put(IS_HEADLESS_KEY, false);
    return new ExponentPackage(true, kernelExperienceProperties, manifest, expoPackages, singletonModules);
  }

  public static List<SingletonModule> getOrCreateSingletonModules(Context context) {
    if (Looper.getMainLooper() != Looper.myLooper()) {
      throw new RuntimeException("Singleton modules must be created on the main thread.");
    }
    if (sSingletonModules == null) {
      sSingletonModules = new ArrayList<>();
      List<Package> expoPackages = ExperiencePackagePicker.packages();

      for (Package expoPackage : expoPackages) {
        sSingletonModules.addAll(expoPackage.createSingletonModules(context));
      }
    }
    return sSingletonModules;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    boolean isVerified = false;
    if (mManifest != null) {
      isVerified = mManifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY);
    }

    List<NativeModule> nativeModules = new ArrayList<>(Arrays.<NativeModule>asList(
        new URLHandlerModule(reactContext),
        new ShakeModule(reactContext),
        new KeyboardModule(reactContext),
        new UpdatesModule(reactContext, mExperienceProperties, mManifest),
        new ExponentIntentModule(reactContext, mExperienceProperties)
    ));

    if (isVerified) {
      try {
        ExperienceId experienceId = ExperienceId.create(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
        ScopedContext scopedContext = new ScopedContext(reactContext, experienceId.getUrlEncoded());

        nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
        nativeModules.add(new NotificationsModule(reactContext, mManifest, mExperienceProperties));
        nativeModules.add(new ImagePickerModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new ImageManipulatorModule(reactContext, scopedContext));
        nativeModules.add(new FacebookModule(reactContext));
        nativeModules.add(new AmplitudeModule(reactContext, scopedContext));
        nativeModules.add(new RNViewShotModule(reactContext, scopedContext));
        nativeModules.add(new KeepAwakeModule(reactContext));
        nativeModules.add(new ExponentTestNativeModule(reactContext));
        nativeModules.add(new WebBrowserModule(reactContext));
        nativeModules.add(new AVModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new VideoManager(reactContext));
        nativeModules.add(new NativeAdManager(reactContext));
        nativeModules.add(new AdSettingsManager(reactContext));
        nativeModules.add(new InterstitialAdManager(reactContext));
        nativeModules.add(new PedometerModule(reactContext));
        nativeModules.add(new SQLiteModule(reactContext, scopedContext));
        nativeModules.add(new DocumentPickerModule(reactContext, scopedContext));
        nativeModules.add(new RNBranchModule(reactContext));
        nativeModules.add(new ErrorRecoveryModule(reactContext, experienceId));
        nativeModules.add(new IntentLauncherModule(reactContext));
        nativeModules.add(new ScreenOrientationModule(reactContext));
        nativeModules.add(new SpeechModule(reactContext));
        nativeModules.add(new SecureStoreModule(reactContext, scopedContext));
        nativeModules.add(new BrightnessModule(reactContext));
        nativeModules.add(new RNGestureHandlerModule(reactContext));
        nativeModules.add(new RNAWSCognitoModule(reactContext));
        nativeModules.add(new MailComposerModule(reactContext));
        nativeModules.add(new CalendarModule(reactContext, experienceId));
        nativeModules.add(new ReanimatedModule(reactContext));
        nativeModules.add(new SplashScreenModule(reactContext, experienceId));

        SvgPackage svgPackage = new SvgPackage();
        nativeModules.addAll(svgPackage.createNativeModules(reactContext));

        // Call to create native modules has to be at the bottom --
        // -- ExpoModuleRegistryAdapter uses the list of native modules
        // to create Bindings for internal modules.
        nativeModules.addAll(mModuleRegistryAdapter.createNativeModules(scopedContext, experienceId, mExperienceProperties, mManifest, nativeModules));
      } catch (JSONException | UnsupportedEncodingException e) {
        EXL.e(TAG, e.toString());
      }
    } else {
      nativeModules.add(new ExponentUnsignedAsyncStorageModule(reactContext));
    }

    return nativeModules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagers = new ArrayList<>(Arrays.<ViewManager>asList(
        new LinearGradientManager(),
        new VideoViewManager(),
        new NativeAdViewManager(),
        new BannerViewManager(),
        new MediaViewManager(),
        new AdIconViewManager()
    ));

    // Add view manager from 3rd party library packages.
    addViewManagersFromPackages(reactContext, viewManagers, Arrays.<ReactPackage>asList(
      new SvgPackage(),
      new MapsPackage(),
      new LottiePackage(),
      new RNGestureHandlerPackage(),
      new RNScreensPackage()
    ));

    viewManagers.addAll(mModuleRegistryAdapter.createViewManagers(reactContext));

    return viewManagers;
  }

  private void addViewManagersFromPackages(ReactApplicationContext reactContext,
                                           List<ViewManager> viewManagers,
                                           List<ReactPackage> packages) {
    for (ReactPackage pack : packages) {
      viewManagers.addAll(pack.createViewManagers(reactContext));
    }
  }

  private ExpoModuleRegistryAdapter createDefaultModuleRegistryAdapterForPackages(List<Package> packages, List<SingletonModule> singletonModules) {
    return new ExpoModuleRegistryAdapter(new ReactModuleRegistryProvider(packages, singletonModules));
  }
}
