
package abi10_0_0.host.exp.exponent.modules.api.viewshot;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi10_0_0.com.facebook.react.ReactPackage;
import abi10_0_0.com.facebook.react.bridge.NativeModule;
import abi10_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi10_0_0.com.facebook.react.uimanager.ViewManager;
import abi10_0_0.com.facebook.react.bridge.JavaScriptModule;
public class RNViewShotPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
      return Arrays.<NativeModule>asList(new RNViewShotModule(reactContext));
    }

    @Override
    public List<Class<? extends JavaScriptModule>> createJSModules() {
      return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
      return Collections.emptyList();
    }
}
