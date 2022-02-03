package abi44_0_0.host.exp.exponent.modules.api.safeareacontext;

import androidx.annotation.NonNull;

import abi44_0_0.com.facebook.react.ReactPackage;
import abi44_0_0.com.facebook.react.bridge.NativeModule;
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi44_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class SafeAreaContextPackage implements ReactPackage {

  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
            new SafeAreaProviderManager(reactContext),
            new SafeAreaViewManager()
    );
  }

}
