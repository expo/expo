package versioned.host.exp.exponent.modules.api.components.datetimepicker;


import androidx.annotation.Nullable;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;
import java.util.Map;

import host.exp.expoview.BuildConfig;

public class RNDateTimePickerPackage extends TurboReactPackage {
  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(DatePickerModule.NAME)) {
      return new DatePickerModule(reactContext);
    } else if (name.equals(TimePickerModule.NAME)) {
      return new TimePickerModule(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      boolean isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      moduleInfos.put(
        DatePickerModule.NAME,
        new ReactModuleInfo(
          DatePickerModule.NAME,
          DatePickerModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // hasConstants
          false, // isCxxModule
          isTurboModule // isTurboModule
        ));
      moduleInfos.put(
        TimePickerModule.NAME,
        new ReactModuleInfo(
          TimePickerModule.NAME,
          TimePickerModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // hasConstants
          false, // isCxxModule
          isTurboModule // isTurboModule
        ));
      return moduleInfos;
    };
  }
}
