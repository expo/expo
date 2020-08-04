package abi37_0_0.host.exp.exponent.modules.api.safeareacontext;

import abi37_0_0.com.facebook.react.ReactPackage;
import abi37_0_0.com.facebook.react.bridge.NativeModule;
import abi37_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi37_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

import javax.annotation.Nonnull;

public class SafeAreaContextPackage implements ReactPackage {

  @Nonnull
  @Override
  public List<NativeModule> createNativeModules(@Nonnull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @Nonnull
  @Override
  public List<ViewManager> createViewManagers(@Nonnull ReactApplicationContext reactContext) {
    return Collections.<ViewManager>singletonList(new SafeAreaViewManager(reactContext));
  }

}
