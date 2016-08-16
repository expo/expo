// Copyright 2015-present 650 Industries. All rights reserved.

package abi7_0_0.host.exp.exponent;

import abi7_0_0.com.facebook.react.ReactPackage;
import abi7_0_0.com.facebook.react.animated.NativeAnimatedModule;
import abi7_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi7_0_0.com.facebook.react.bridge.NativeModule;
import abi7_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi7_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import host.exp.exponent.ActivityResultDelegator;
import host.exp.exponent.ExponentApplication;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.modules.ExponentKernelModule;
import abi7_0_0.host.exp.exponent.modules.api.CryptoModule;
import abi7_0_0.host.exp.exponent.modules.api.FabricModule;
import abi7_0_0.host.exp.exponent.modules.api.FacebookModule;
import abi7_0_0.host.exp.exponent.modules.api.URLHandlerModule;
import abi7_0_0.host.exp.exponent.modules.api.ConstantsModule;
import abi7_0_0.host.exp.exponent.modules.api.ContactsModule;
import abi7_0_0.host.exp.exponent.modules.api.FontLoaderModule;
import abi7_0_0.host.exp.exponent.modules.api.ImageCropperModule;
import abi7_0_0.host.exp.exponent.modules.api.KeyboardModule;
import abi7_0_0.host.exp.exponent.modules.api.LocationModule;
import abi7_0_0.host.exp.exponent.modules.api.NotificationsModule;
import abi7_0_0.host.exp.exponent.modules.api.ShakeModule;
import abi7_0_0.host.exp.exponent.modules.api.UtilModule;
import abi7_0_0.host.exp.exponent.modules.api.ImagePickerModule;
import abi7_0_0.host.exp.exponent.modules.api.components.LinearGradientManager;
import abi7_0_0.host.exp.exponent.modules.api.filesystem.FileSystemModule;
import abi7_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi7_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;

public class ExponentPackage implements ReactPackage {

  private final ExponentApplication mApplication;
  private final boolean mIsKernel;
  private final Map<String, Object> mExperienceProperties;
  private final JSONObject mManifest;
  private final ActivityResultDelegator mDelegator;

  public ExponentPackage(ExponentApplication application, Map<String, Object> experienceProperties,
                         JSONObject manifest, ActivityResultDelegator delegator) {
    mApplication = application;
    mIsKernel = false;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
    mDelegator = delegator;
  }

  public ExponentPackage(ExponentApplication application) {
    mApplication = application;
    mIsKernel = true;
    mExperienceProperties = null;
    mManifest = new JSONObject();
    mDelegator = null;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    boolean isVerified = false;
    if (mManifest != null) {
      isVerified = mManifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY);
    }

    List<NativeModule> nativeModules = new ArrayList<>(Arrays.<NativeModule>asList(
        new URLHandlerModule(reactContext, mApplication),
        new ConstantsModule(reactContext, mApplication, mExperienceProperties, mManifest),
        new ShakeModule(reactContext),
        new FontLoaderModule(reactContext, mApplication, mManifest),
        new KeyboardModule(reactContext),
        new UtilModule(reactContext),
        new NativeAnimatedModule(reactContext)
    ));

    if (mIsKernel) {
      // Never need this in versioned code. Comment this out if this is in an abi package
      //nativeModules.add(new ExponentKernelModule(reactContext, mApplication));
    } else {
      if (isVerified) {
        nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
        nativeModules.add(new NotificationsModule(reactContext, mApplication, mManifest));
        nativeModules.add(new ContactsModule(reactContext, mApplication));
        nativeModules.add(new FileSystemModule(reactContext, mManifest));
        nativeModules.add(new LocationModule(reactContext));
        nativeModules.add(new CryptoModule(reactContext));
        nativeModules.add(new ImagePickerModule(reactContext, mDelegator));
        nativeModules.add(new FacebookModule(reactContext, mDelegator, mApplication));
        nativeModules.add(new FabricModule(reactContext, mExperienceProperties));
      } else {
        nativeModules.add(new ExponentUnsignedAsyncStorageModule(reactContext));
      }
      nativeModules.add(new ImageCropperModule(reactContext, mDelegator));
    }

    return nativeModules;
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
            new LinearGradientManager()
            );
  }
}
