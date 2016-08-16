// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import abi5_0_0.com.facebook.react.ReactPackage;
import abi5_0_0.com.facebook.react.animated.NativeAnimatedModule;
import abi5_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi5_0_0.com.facebook.react.bridge.NativeModule;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.uimanager.ViewManager;
import abi5_0_0.host.exp.exponent.modules.filesystem.ExponentFileSystem;
import abi5_0_0.host.exp.exponent.modules.overridden.asyncstorage.ExponentAsyncStorageModule;
import abi5_0_0.host.exp.exponent.modules.overridden.asyncstorage.ExponentUnsignedAsyncStorageModule;
import host.exp.exponent.ExponentApplication;
import host.exp.exponent.ExponentManifest;

public class ExponentPackage implements ReactPackage {

  private final ExponentApplication mApplication;
  private final boolean mIsKernel;
  private final Map<String, Object> mExperienceProperties;
  private final JSONObject mManifest;

  public ExponentPackage(ExponentApplication application, Map<String, Object> experienceProperties,
                         JSONObject manifest) {
    mApplication = application;
    mIsKernel = false;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
  }

  public ExponentPackage(ExponentApplication application) {
    mApplication = application;
    mIsKernel = true;
    mExperienceProperties = null;
    mManifest = null;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    boolean isVerified = false;
    if (mManifest != null) {
      isVerified = mManifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY);
    }

    List<NativeModule> nativeModules = new ArrayList<>(Arrays.<NativeModule>asList(
        new ExponentDevelopmentHostModule(reactContext),
        new ExponentVersionsModule(reactContext, mApplication),
        new ExURLHandlerModule(reactContext, mApplication),
        new ExponentConstantsModule(reactContext, mApplication, mExperienceProperties),
        new ExponentShakeModule(reactContext),
        new ExponentFontLoaderModule(reactContext, mApplication, mManifest),
        new ExponentDeviceClassModule(reactContext),
        new ExponentKeyboardModule(reactContext),
        new ExponentUtilModule(reactContext),
        new NativeAnimatedModule(reactContext)
    ));

    if (mIsKernel) {
//      nativeModules.add(new ExponentKernelModule(reactContext, mApplication));
    } else if (isVerified) {
      nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
      nativeModules.add(new ExponentNotificationsModule(reactContext, mApplication, mManifest));
      nativeModules.add(new ExponentContactsModule(reactContext, mApplication));
      nativeModules.add(new ExponentWebJavaScriptModule(reactContext));
      nativeModules.add(new ExponentFileSystem(reactContext, mManifest));
      nativeModules.add(new ExponentLocationModule(reactContext));
    } else {
      nativeModules.add(new ExponentUnsignedAsyncStorageModule(reactContext));
    }

    return nativeModules;
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
