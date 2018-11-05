package abi30_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.pm.ActivityInfo;

import abi30_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi30_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;

import javax.annotation.Nullable;

public class ScreenOrientationModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private @Nullable Integer mInitialOrientation = null;

  public ScreenOrientationModule(ReactApplicationContext reactContext) {
    super(reactContext);

    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "ExponentScreenOrientation";
  }

  @Override
  public void onHostResume() {
    Activity activity = getCurrentActivity();
    if (activity != null && mInitialOrientation == null) {
      mInitialOrientation = activity.getRequestedOrientation();
    }
  }

  @Override
  public void onHostPause() {

  }

  @Override
  public void onHostDestroy() {

  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();

    Activity activity = getCurrentActivity();
    if (activity != null && mInitialOrientation != null) {
      activity.setRequestedOrientation(mInitialOrientation);
    }
  }

  @SuppressWarnings("WrongConstant")
  @ReactMethod
  void allow(String orientation) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      return;
    }

    activity.setRequestedOrientation(convertToOrientationEnum(orientation));
  }

  private int convertToOrientationEnum(String orientation) {
    switch (orientation) {
      case "ALL":
        return ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR;
      case "ALL_BUT_UPSIDE_DOWN":
        return ActivityInfo.SCREEN_ORIENTATION_SENSOR;
      case "PORTRAIT":
        return ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;
      case "PORTRAIT_UP":
        return ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
      case "PORTRAIT_DOWN":
        return ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT;
      case "LANDSCAPE":
        return ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
      case "LANDSCAPE_LEFT":
        return ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
      case "LANDSCAPE_RIGHT":
        return ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE;
      default:
        throw new JSApplicationIllegalArgumentException("Invalid screen orientation " + orientation);
    }
  }
}

