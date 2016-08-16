package abi5_0_0.host.exp.exponent.modules.external.image_picker;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi5_0_0.com.facebook.react.ReactPackage;
import abi5_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi5_0_0.com.facebook.react.bridge.NativeModule;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.uimanager.ViewManager;
import host.exp.exponent.ActivityResultDelegator;

public class ImagePickerPackage implements ReactPackage {
  private final ActivityResultDelegator mDelegator;
  private ImagePickerModule mModuleInstance;

  public ImagePickerPackage(ActivityResultDelegator delegator) {
    mDelegator = delegator;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    mModuleInstance = new ImagePickerModule(reactContext, mDelegator);

    return Arrays.<NativeModule>asList(mModuleInstance);
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
