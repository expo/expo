package abi28_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.WritableMap;

public class BrightnessModule extends ReactContextBaseJavaModule {

  public BrightnessModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentBrightness";
  }

  @ReactMethod
  public void setBrightnessAsync(final float brightnessValue, final Promise promise) {
    final Activity activity = getCurrentActivity();
    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        try {
          WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
          lp.screenBrightness = brightnessValue;
          activity.getWindow().setAttributes(lp); // must be done on UI thread
          promise.resolve(null);
        } catch (Exception e){
          promise.reject("E_BRIGHTNESS", e.getMessage());
        }
      }
    });

  }

  @ReactMethod
  public void getBrightnessAsync(final Promise promise) {
    WindowManager.LayoutParams lp = getCurrentActivity().getWindow().getAttributes();
    promise.resolve(lp.screenBrightness);
  }

  @ReactMethod
  public void getSystemBrightnessAsync(final Promise promise){
    String brightness = Settings.System.getString(getCurrentActivity().getContentResolver(), "screen_brightness");
    promise.resolve(Integer.parseInt(brightness)/255f);
  }

  @ReactMethod
  public void setSystemBrightnessAsync(final float brightnessValue, final Promise promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.System.canWrite(getCurrentActivity()) || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        // manual mode must be set in order to change system brightness (sets the automatic mode off)
        Settings.System.putInt(
            getCurrentActivity().getContentResolver(),
            Settings.System.SCREEN_BRIGHTNESS_MODE,
            Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL
        );
        Settings.System.putInt(
            getCurrentActivity().getContentResolver(),
            Settings.System.SCREEN_BRIGHTNESS,
            Math.round(brightnessValue * 255)
        );
        promise.resolve(null);
      } else {
        promise.reject("E_BRIGHTNESS_PERMISSIONS", "WRITE_SETTINGS not granted");
      }
    } catch (Exception e){
      promise.reject("E_BRIGHTNESS", e.getMessage());
    }
  }
}
