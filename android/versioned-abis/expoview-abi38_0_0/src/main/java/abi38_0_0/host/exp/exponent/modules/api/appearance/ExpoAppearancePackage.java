package abi38_0_0.host.exp.exponent.modules.api.appearance;

import abi38_0_0.com.facebook.react.bridge.NativeModule;
import abi38_0_0.com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import abi38_0_0.host.exp.exponent.modules.api.appearance.rncappearance.RNCAppearancePackage;

public class ExpoAppearancePackage extends RNCAppearancePackage {
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new ExpoAppearanceModule(reactContext));
    return modules;
  }
}
