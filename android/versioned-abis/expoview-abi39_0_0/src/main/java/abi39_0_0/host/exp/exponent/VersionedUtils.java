// Copyright 2015-present 650 Industries. All rights reserved.

package abi39_0_0.host.exp.exponent;

import android.app.Activity;
import android.util.Log;

import abi39_0_0.com.facebook.react.ReactInstanceManager;
import abi39_0_0.com.facebook.react.ReactInstanceManagerBuilder;
import abi39_0_0.com.facebook.react.bridge.NativeModule;
import abi39_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi39_0_0.com.facebook.react.common.LifecycleState;
import abi39_0_0.com.facebook.react.shell.MainReactPackage;

import java.lang.reflect.Field;
import java.util.Collections;

import host.exp.exponent.RNObject;
import host.exp.exponent.experience.ReactNativeActivity;
import host.exp.expoview.Exponent;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedJSIModulePackage;

public class VersionedUtils {

  public static ReactInstanceManagerBuilder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.getApplication())
        .setJSIModulesPackage((reactApplicationContext, jsContext) -> {
          RNObject devSupportManager = getDevSupportManager(reactApplicationContext);
          if (devSupportManager == null) {
            Log.e("Exponent", "Couldn't get the `DevSupportManager`. JSI modules won't be initialized.");
            return Collections.emptyList();
          }

          RNObject devSettings = devSupportManager.callRecursive("getDevSettings");
          boolean isRemoteJSDebugEnabled = devSettings != null && (boolean) devSettings.call("isRemoteJSDebugEnabled");
          if (!isRemoteJSDebugEnabled) {
            return new ReanimatedJSIModulePackage().getJSIModules(reactApplicationContext, jsContext);
          }

          return Collections.emptyList();
        })
        .addPackage(new MainReactPackage())
        .addPackage(new ExponentPackage(
                instanceManagerBuilderProperties.getExperienceProperties(),
                instanceManagerBuilderProperties.getManifest(),
                null, null,
                instanceManagerBuilderProperties.getSingletonModules()))
        .addPackage(new ExpoTurboPackage(
          instanceManagerBuilderProperties.getExperienceProperties(),
          instanceManagerBuilderProperties.getManifest()))
        .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

    if (instanceManagerBuilderProperties.getJsBundlePath() != null && instanceManagerBuilderProperties.getJsBundlePath().length() > 0) {
      builder = builder.setJSBundleFile(instanceManagerBuilderProperties.getJsBundlePath());
    }

    return builder;
  }

  private static RNObject getDevSupportManager(ReactApplicationContext reactApplicationContext) {
    Activity currentActivity = Exponent.getInstance().getCurrentActivity();
    if (currentActivity != null) {
      if (currentActivity instanceof ReactNativeActivity) {
        ReactNativeActivity reactNativeActivity = (ReactNativeActivity) currentActivity;
        return reactNativeActivity.getDevSupportManager();
      } else {
        return null;
      }
    }

    try {
      NativeModule devSettingsModule = reactApplicationContext.getCatalystInstance().getNativeModule("DevSettings");
      Field devSupportManagerField = devSettingsModule.getClass().getDeclaredField("mDevSupportManager");
      devSupportManagerField.setAccessible(true);
      return RNObject.wrap(devSupportManagerField.get(devSettingsModule));
    } catch (Throwable e) {
      e.printStackTrace();
      return null;
    }
  }
}
