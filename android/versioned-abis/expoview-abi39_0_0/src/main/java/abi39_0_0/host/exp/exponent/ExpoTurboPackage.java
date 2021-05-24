// Copyright 2020-present 650 Industries. All rights reserved.

package abi39_0_0.host.exp.exponent;

import abi39_0_0.com.facebook.react.TurboReactPackage;
import abi39_0_0.com.facebook.react.bridge.NativeModule;
import abi39_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi39_0_0.com.facebook.react.module.annotations.ReactModule;
import abi39_0_0.com.facebook.react.module.annotations.ReactModuleList;
import abi39_0_0.com.facebook.react.module.model.ReactModuleInfo;
import abi39_0_0.com.facebook.react.module.model.ReactModuleInfoProvider;
import abi39_0_0.com.facebook.react.turbomodule.core.interfaces.TurboModule;
import abi39_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.ExponentManifest;
import abi39_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi39_0_0.host.exp.exponent.modules.internal.ExponentIntentModule;
import abi39_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;

import static host.exp.exponent.kernel.KernelConstants.IS_HEADLESS_KEY;
import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;


/** Package defining basic modules and view managers. */
@ReactModuleList(
  nativeModules = {
    // TODO(Bacon): Do we need to support unsigned storage module here?
    ExponentAsyncStorageModule.class,
    ExponentIntentModule.class,
  })
public class ExpoTurboPackage extends TurboReactPackage {
  private static final String TAG = ExpoTurboPackage.class.getSimpleName();
  private final Map<String, Object> mExperienceProperties;
  private final RawManifest mManifest;

  public ExpoTurboPackage(Map<String, Object> experienceProperties, RawManifest manifest) {
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
  }

  public static ExpoTurboPackage kernelExpoTurboPackage(RawManifest manifest) {
    Map<String, Object> kernelExperienceProperties = new HashMap<>();
    kernelExperienceProperties.put(LINKING_URI_KEY, "exp://");
    kernelExperienceProperties.put(IS_HEADLESS_KEY, false);
    return new ExpoTurboPackage(kernelExperienceProperties, manifest);
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagers = new ArrayList<>();
    return viewManagers;
  }

  @Override
  public NativeModule getModule(String name, ReactApplicationContext context) {
    boolean isVerified = false;
    if (mManifest != null) {
      isVerified = mManifest.isVerified();
    }
    switch (name) {
      case ExponentAsyncStorageModule.NAME:
        if (isVerified) {
          return new ExponentAsyncStorageModule(context, mManifest);
        } else {
          return new ExponentUnsignedAsyncStorageModule(context);
        }
      case ExponentIntentModule.NAME:
        return new ExponentIntentModule(context, mExperienceProperties);

//      case URLHandlerModule.NAME:
//        return new URLHandlerModule(context);
//      case ShakeModule.NAME:
//        return new ShakeModule(context);
//      case KeyboardModule.NAME:
//        return new KeyboardModule(context);
//      case UpdatesModule.NAME:
//        return new UpdatesModule(context, mExperienceProperties, mManifest);
////      case ExponentKernelModuleProvider.NAME:
////        return (NativeModule) ExponentKernelModuleProvider.newInstance(context);
////      if (mIsKernel) {
////        // WHEN_VERSIONING_REMOVE_FROM_HERE
////        nativeModules.add((NativeModule) ExponentKernelModuleProvider.newInstance(reactContext));
////        // WHEN_VERSIONING_REMOVE_TO_HERE
////      }
//      case DevMenuModule.NAME:
////        if (!mIsKernel && !Constants.isStandaloneApp()) {
//        // We need DevMenuModule only in non-home and non-standalone apps.
//        return new DevMenuModule(context, mExperienceProperties, mManifest);
////      }
      default:
        return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    try {
      // TODO(Bacon): Does this need to reflect ExpoTurboPackage$$ReactModuleInfoProvider ?
      Class<?> reactModuleInfoProviderClass =
        Class.forName("com.facebook.react.shell.MainReactPackage$$ReactModuleInfoProvider");
      return (ReactModuleInfoProvider) reactModuleInfoProviderClass.newInstance();
    } catch (ClassNotFoundException e) {
      // In OSS case, the annotation processor does not run. We fall back on creating this by hand
      Class<? extends NativeModule>[] moduleList =
        new Class[] {
          // TODO(Bacon): Do we need to support unsigned storage module here?
          ExponentAsyncStorageModule.class,
          ExponentIntentModule.class,
        };

      final Map<String, ReactModuleInfo> reactModuleInfoMap = new HashMap<>();
      for (Class<? extends NativeModule> moduleClass : moduleList) {
        ReactModule reactModule = moduleClass.getAnnotation(ReactModule.class);
        Boolean isTurbo = TurboModule.class.isAssignableFrom(moduleClass);
        reactModuleInfoMap.put(
          reactModule.name(),
          new ReactModuleInfo(
            reactModule.name(),
            moduleClass.getName(),
            reactModule.canOverrideExistingModule(),
            reactModule.needsEagerInit(),
            reactModule.hasConstants(),
            reactModule.isCxxModule(),
            isTurbo));
      }

      return new ReactModuleInfoProvider() {
        @Override
        public Map<String, ReactModuleInfo> getReactModuleInfos() {
          return reactModuleInfoMap;
        }
      };
    } catch (InstantiationException e) {
      throw new RuntimeException(
        "No ReactModuleInfoProvider for CoreModulesPackage$$ReactModuleInfoProvider", e);
    } catch (IllegalAccessException e) {
      throw new RuntimeException(
        "No ReactModuleInfoProvider for CoreModulesPackage$$ReactModuleInfoProvider", e);
    }
  }

}
