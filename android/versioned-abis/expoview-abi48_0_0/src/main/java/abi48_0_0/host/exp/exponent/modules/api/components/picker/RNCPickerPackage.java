
package abi48_0_0.host.exp.exponent.modules.api.components.picker;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi48_0_0.com.facebook.react.ReactPackage;
import abi48_0_0.com.facebook.react.bridge.NativeModule;
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi48_0_0.com.facebook.react.uimanager.ViewManager;
import abi48_0_0.com.facebook.react.bridge.JavaScriptModule;
public class RNCPickerPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
      return Collections.emptyList();
    }

    // Deprecated from RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
      return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        List<ViewManager> list = new ArrayList<>();
        list.add(new ReactDialogPickerManager());
        list.add(new ReactDropdownPickerManager());
      return list;
    }
}