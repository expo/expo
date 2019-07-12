package abi34_0_0.host.exp.exponent.modules.api.components.webview;

import abi34_0_0.com.facebook.react.ReactPackage;
import abi34_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi34_0_0.com.facebook.react.bridge.NativeModule;
import abi34_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi34_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

public class RNCWebViewPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Collections.singletonList(new RNCWebViewModule(reactContext));
  }

  // Deprecated from RN 0.47
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.singletonList(new RNCWebViewManager());
  }
}
