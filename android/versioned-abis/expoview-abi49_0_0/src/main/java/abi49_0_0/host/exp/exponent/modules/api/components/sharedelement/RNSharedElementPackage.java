package abi49_0_0.host.exp.exponent.modules.api.components.sharedelement;

import androidx.annotation.NonNull;

import java.util.*;

import abi49_0_0.com.facebook.react.ReactPackage;
import abi49_0_0.com.facebook.react.bridge.NativeModule;
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.uimanager.ViewManager;

public class RNSharedElementPackage implements ReactPackage {

  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    return Collections.singletonList(new RNSharedElementModule(reactContext));
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.singletonList(new RNSharedElementTransitionManager(reactContext));
  }
}
