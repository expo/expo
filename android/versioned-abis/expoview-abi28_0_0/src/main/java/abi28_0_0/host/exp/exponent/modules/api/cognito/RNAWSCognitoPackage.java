package abi28_0_0.host.exp.exponent.modules.api.cognito;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi28_0_0.com.facebook.react.ReactPackage;
import abi28_0_0.com.facebook.react.bridge.NativeModule;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.uimanager.ViewManager;
import abi28_0_0.com.facebook.react.bridge.JavaScriptModule;

public class RNAWSCognitoPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
      return Arrays.<NativeModule>asList(new RNAWSCognitoModule(reactContext));
    }

    public List<Class<? extends JavaScriptModule>> createJSModules() {
      return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
      return Collections.emptyList();
    }
}
