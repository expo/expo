
package fr.greweb.reactnativeviewshot;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nonnull;

public class RNViewShotPackage extends TurboReactPackage {
  @Override
  @Nonnull
  public List<NativeModule> createNativeModules(@Nonnull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new RNViewShotModule(reactContext, reactContext.getCacheDir(), reactContext.getExternalCacheDir()));
    return modules;
  }
  
  @Nullable
  @Override
  public NativeModule getModule(@NonNull String name, @NonNull ReactApplicationContext reactApplicationContext) {
    if (name.equals(RNViewShotModule.NAME)) {
      return new RNViewShotModule(reactApplicationContext, reactApplicationContext.getCacheDir(), reactApplicationContext.getExternalCacheDir());
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      boolean isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
      moduleInfos.put(
              RNViewShotModule.NAME,
              new ReactModuleInfo(
                      RNViewShotModule.NAME,
                      RNViewShotModule.NAME,
                      false, // canOverrideExistingModule
                      false, // needsEagerInit
                      false, // isCxxModule
                      isTurboModule // isTurboModule
              ));
      return moduleInfos;
    };
  }
}