// Copyright 2015-present 650 Industries. All rights reserved.

package abi8_0_0.host.exp.exponent;

import abi8_0_0.com.facebook.react.ReactPackage;
import abi8_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi8_0_0.com.facebook.react.bridge.NativeModule;
import abi8_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi8_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import host.exp.exponent.ExponentManifest;
import abi8_0_0.host.exp.exponent.modules.api.CryptoModule;
import abi8_0_0.host.exp.exponent.modules.api.FabricModule;
import abi8_0_0.host.exp.exponent.modules.api.FacebookModule;
import abi8_0_0.host.exp.exponent.modules.api.FingerprintModule;
import abi8_0_0.host.exp.exponent.modules.api.PermissionsModule;
import abi8_0_0.host.exp.exponent.modules.api.URLHandlerModule;
import abi8_0_0.host.exp.exponent.modules.api.ConstantsModule;
import abi8_0_0.host.exp.exponent.modules.api.ContactsModule;
import abi8_0_0.host.exp.exponent.modules.api.FontLoaderModule;
import abi8_0_0.host.exp.exponent.modules.api.ImageCropperModule;
import abi8_0_0.host.exp.exponent.modules.api.KeyboardModule;
import abi8_0_0.host.exp.exponent.modules.api.LocationModule;
import abi8_0_0.host.exp.exponent.modules.api.NotificationsModule;
import abi8_0_0.host.exp.exponent.modules.api.ShakeModule;
import abi8_0_0.host.exp.exponent.modules.api.UtilModule;
import abi8_0_0.host.exp.exponent.modules.api.ImagePickerModule;
import abi8_0_0.host.exp.exponent.modules.api.components.LinearGradientManager;
import abi8_0_0.host.exp.exponent.modules.api.FileSystemModule;
import abi8_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi8_0_0.host.exp.exponent.modules.internal.ExponentIntentModule;
import abi8_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;

public class ExponentPackage implements ReactPackage {

  private final boolean mIsKernel;
  private final Map<String, Object> mExperienceProperties;
  private final JSONObject mManifest;

  public ExponentPackage(Map<String, Object> experienceProperties, JSONObject manifest) {
    mIsKernel = false;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
  }

  public ExponentPackage() {
    mIsKernel = true;
    mExperienceProperties = null;
    mManifest = new JSONObject();
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    boolean isVerified = false;
    if (mManifest != null) {
      isVerified = mManifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY);
    }

    List<NativeModule> nativeModules = new ArrayList<>(Arrays.<NativeModule>asList(
        new URLHandlerModule(reactContext),
        new ConstantsModule(reactContext, mExperienceProperties, mManifest),
        new ShakeModule(reactContext),
        new FontLoaderModule(reactContext),
        new KeyboardModule(reactContext),
        new UtilModule(reactContext),
        new ExponentIntentModule(reactContext)
    ));

    if (mIsKernel) {
      // Never need this in versioned code. Comment this out if this is in an abi package
      //nativeModules.add(new ExponentKernelModule(reactContext, mApplication));
    } else {
      if (isVerified) {
        nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
        nativeModules.add(new NotificationsModule(reactContext, mManifest));
        nativeModules.add(new ContactsModule(reactContext));
        nativeModules.add(new FileSystemModule(reactContext, mManifest));
        nativeModules.add(new LocationModule(reactContext));
        nativeModules.add(new CryptoModule(reactContext));
        nativeModules.add(new ImagePickerModule(reactContext));
        nativeModules.add(new FacebookModule(reactContext));
        nativeModules.add(new FabricModule(reactContext, mExperienceProperties));
        nativeModules.add(new FingerprintModule(reactContext));
        nativeModules.add(new PermissionsModule(reactContext));
      } else {
        nativeModules.add(new ExponentUnsignedAsyncStorageModule(reactContext));
      }
      nativeModules.add(new ImageCropperModule(reactContext));
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
