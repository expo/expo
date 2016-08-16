package abi5_0_0.host.exp.exponent.modules.external.facebook;

import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi5_0_0.com.facebook.react.ReactPackage;
import abi5_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi5_0_0.com.facebook.react.bridge.NativeModule;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.uimanager.ViewManager;
import host.exp.exponent.ActivityResultDelegator;

public class FacebookLoginPackage implements ReactPackage {
  private final ActivityResultDelegator mActivityResultDelegator;
  private final Context mContext;

  public FacebookLoginPackage(ActivityResultDelegator activityResultDelegator, Context context) {
    mActivityResultDelegator = activityResultDelegator;
    mContext = context;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Arrays.<NativeModule>asList(new FacebookLoginModule(reactContext, mActivityResultDelegator, mContext));
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
