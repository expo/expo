// Copyright 2015-present 650 Industries. All rights reserved.

package abi33_0_0.host.exp.exponent;

import android.content.Context;
import android.os.Looper;

import org.json.JSONException;
import org.json.JSONObject;
import org.unimodules.core.interfaces.SingletonModule;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import abi33_0_0.com.facebook.react.ReactPackage;
import abi33_0_0.com.facebook.react.bridge.NativeModule;
import abi33_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi33_0_0.com.facebook.react.uimanager.ViewManager;
import abi33_0_0.host.exp.exponent.modules.api.ErrorRecoveryModule;
import abi33_0_0.host.exp.exponent.modules.api.KeyboardModule;
import abi33_0_0.host.exp.exponent.modules.api.PedometerModule;
import abi33_0_0.host.exp.exponent.modules.api.ScreenOrientationModule;
import abi33_0_0.host.exp.exponent.modules.api.ShakeModule;
import abi33_0_0.host.exp.exponent.modules.api.SplashScreenModule;
import abi33_0_0.host.exp.exponent.modules.api.URLHandlerModule;
import abi33_0_0.host.exp.exponent.modules.api.UpdatesModule;
import abi33_0_0.host.exp.exponent.modules.api.cognito.RNAWSCognitoModule;
import abi33_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule;
import abi33_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerPackage;
import abi33_0_0.host.exp.exponent.modules.api.components.lottie.LottiePackage;
import abi33_0_0.host.exp.exponent.modules.api.components.maps.MapsPackage;
import abi33_0_0.host.exp.exponent.modules.api.components.svg.SvgPackage;
import abi33_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewModule;
import abi33_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewPackage;
import abi33_0_0.host.exp.exponent.modules.api.netinfo.NetInfoModule;
import abi33_0_0.host.exp.exponent.modules.api.notifications.NotificationsModule;
import abi33_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedModule;
import abi33_0_0.host.exp.exponent.modules.api.screens.RNScreensPackage;
import abi33_0_0.host.exp.exponent.modules.api.viewshot.RNViewShotModule;
import abi33_0_0.host.exp.exponent.modules.internal.DevMenuModule;
import abi33_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi33_0_0.host.exp.exponent.modules.internal.ExponentIntentModule;
import abi33_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;
import abi33_0_0.host.exp.exponent.modules.test.ExponentTestNativeModule;
import abi33_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;
import abi33_0_0.host.exp.exponent.modules.universal.ScopedModuleRegistryAdapter;
import abi33_0_0.org.unimodules.adapters.react.ReactModuleRegistryProvider;
import abi33_0_0.org.unimodules.core.interfaces.Package;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;

import static host.exp.exponent.kernel.KernelConstants.IS_HEADLESS_KEY;
import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;

public class ExponentPackage implements ReactPackage {
  private static final String TAG = ExponentPackage.class.getSimpleName();
  private static List<SingletonModule> sSingletonModules;
  private static Set<Class> sSingletonModulesClasses;

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
    List<SingletonModule> singletonModules = ExponentPackage.getOrCreateSingletonModules(context, manifest, expoPackages);
    kernelExperienceProperties.put(LINKING_URI_KEY, "exp://");
    kernelExperienceProperties.put(IS_HEADLESS_KEY, false);
    return new ExponentPackage(true, kernelExperienceProperties, manifest, expoPackages, singletonModules);
  }

  public static List<SingletonModule> getOrCreateSingletonModules(Context context, JSONObject manifest, List<Package> providedExpoPackages) {
    if (Looper.getMainLooper() != Looper.myLooper()) {
      throw new RuntimeException("Singleton modules must be created on the main thread.");
    }
    if (sSingletonModules == null) {
      sSingletonModules = new ArrayList<>();
    }
    if (sSingletonModulesClasses == null) {
      sSingletonModulesClasses = new HashSet<>();
    }
    List<Package> expoPackages = providedExpoPackages;
    if (expoPackages == null) {
      expoPackages = ExperiencePackagePicker.packages(manifest);
    }

    for (Package expoPackage : expoPackages) {
      // For now we just accumulate more and more singleton modules,
      // but in fact we should only return singleton modules from the requested
      // unimodules. This solution also unnecessarily creates singleton modules
      // which are going to be deallocated in a tick, but there's no better solution
      // without a bigger-than-minimal refactor. In SDK32 the only singleton module
      // is TaskService which is safe to initialize more than once.
      List<? extends SingletonModule> packageSingletonModules = expoPackage.createSingletonModules(context);
      for (SingletonModule singletonModule : packageSingletonModules) {
        if (!sSingletonModulesClasses.contains(singletonModule.getClass())) {
          sSingletonModules.add(singletonModule);
          sSingletonModulesClasses.add(singletonModule.getClass());
        }
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

//    if (mIsKernel) {
//      // Never need this in versioned code. Comment this out if this is in an abi package
//      nativeModules.add((NativeModule) ExponentKernelModuleProvider.newInstance(reactContext));
//    }
    if (!mIsKernel) {
      // We need DevMenuModule only in non-kernel apps.
      nativeModules.add(new DevMenuModule(reactContext, mExperienceProperties, mManifest));
    }

    if (isVerified) {
      try {
        ExperienceId experienceId = ExperienceId.create(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
        ScopedContext scopedContext = new ScopedContext(reactContext, experienceId.getUrlEncoded());

        nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
        nativeModules.add(new NotificationsModule(reactContext, mManifest, mExperienceProperties));
        nativeModules.add(new RNViewShotModule(reactContext, scopedContext));
        nativeModules.add(new ExponentTestNativeModule(reactContext));
        nativeModules.add(new PedometerModule(reactContext));
        nativeModules.add(new ErrorRecoveryModule(reactContext, experienceId));
        nativeModules.add(new ScreenOrientationModule(reactContext));
        nativeModules.add(new RNGestureHandlerModule(reactContext));
        nativeModules.add(new RNAWSCognitoModule(reactContext));
        nativeModules.add(new ReanimatedModule(reactContext));
        nativeModules.add(new SplashScreenModule(reactContext, experienceId));
        nativeModules.add(new RNCWebViewModule(reactContext));
        nativeModules.add(new NetInfoModule(reactContext));
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
    List<ViewManager> viewManagers = new ArrayList<>();

    // Add view manager from 3rd party library packages.
    addViewManagersFromPackages(reactContext, viewManagers, Arrays.<ReactPackage>asList(
        new SvgPackage(),
        new MapsPackage(),
        new LottiePackage(),
        new RNGestureHandlerPackage(),
        new RNScreensPackage(),
        new RNCWebViewPackage()
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
