package versioned.host.exp.exponent.modules.api.appearance;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import versioned.host.exp.exponent.modules.api.appearance.rncappearance.RNCAppearancePackage;

public class ExpoAppearancePackage extends RNCAppearancePackage {
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new ExpoAppearanceModule(reactContext));
    return modules;
  }
}
