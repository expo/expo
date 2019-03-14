package expo.modules.brightness;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.InvalidArgumentException;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

public class BrightnessModule extends ExportedModule implements ModuleRegistryConsumer {
  private ModuleRegistry mModuleRegistry;

  public BrightnessModule(Context reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExpoBrightness";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
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
        } catch (Exception e) {
          promise.reject("ERR_BRIGHTNESS", "Failed to set the current screen brightness", e);
        }
      }
    });
  }

  @ExpoMethod
  public void getBrightnessAsync(final Promise promise) {
    final Activity activity = getCurrentActivity();
    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        WindowManager.LayoutParams lp = getCurrentActivity().getWindow().getAttributes();
        if (lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE) {
          // system brightness is not overridden by the current activity, so just resolve with it
          getSystemBrightnessAsync(promise);
        } else {
          promise.resolve(lp.screenBrightness);
        }
      }
    });
  }

  @ExpoMethod
  public void getSystemBrightnessAsync(Promise promise) {
    try {
      int brightnessMode = Settings.System.getInt(
          getCurrentActivity().getContentResolver(),
          Settings.System.SCREEN_BRIGHTNESS_MODE
      );
      if (brightnessMode == Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC) {
        float brightness = Settings.System.getFloat(
            getCurrentActivity().getContentResolver(),
            // https://stackoverflow.com/questions/29349153/change-adaptive-brightness-level-programatically
            // this setting cannot be changed starting in targetSdkVersion 23, but it can still be read
            "screen_auto_brightness_adj"
        );
        promise.resolve((brightness + 1.0f) / 2);
      } else {
        String brightness = Settings.System.getString(
            getCurrentActivity().getContentResolver(),
            Settings.System.SCREEN_BRIGHTNESS
        );
        promise.resolve(Integer.parseInt(brightness) / 255f);
      }
    } catch (Exception e) {
      promise.reject("ERR_BRIGHTNESS_SYSTEM", "Failed to get the system brightness value", e);
    }
  }

  @ExpoMethod
  public void setSystemBrightnessAsync(float brightnessValue, Promise promise) {
    try {
      // we have to just check this every time
      // if we try to store a value for this permission, there is no way to know if the user has changed it
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(getCurrentActivity())) {
        promise.reject("ERR_BRIGHTNESS_PERMISSIONS_DENIED", "WRITE_SETTINGS permission has not been granted");
        return;
      }
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
    } catch (Exception e) {
      promise.reject("ERR_BRIGHTNESS_SYSTEM", "Failed to set the system brightness value", e);
    }
  }

  @ExpoMethod
  public void useSystemBrightnessAsync(final Promise promise) {
    final Activity activity = getCurrentActivity();
    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        try {
          WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
          lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
          activity.getWindow().setAttributes(lp); // must be done on UI thread
          promise.resolve(null);
        } catch (Exception e) {
          promise.reject("ERR_BRIGHTNESS", "Failed to set the brightness of the current screen", e);
        }
      }
    });
  }

  @ExpoMethod
  public void isUsingSystemBrightnessAsync(final Promise promise) {
    final Activity activity = getCurrentActivity();
    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        WindowManager.LayoutParams lp = getCurrentActivity().getWindow().getAttributes();
        promise.resolve(lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE);
      }
    });
  }

  @ExpoMethod
  public void getSystemBrightnessModeAsync(Promise promise) {
    try {
      int brightnessMode = Settings.System.getInt(
          getCurrentActivity().getContentResolver(),
          Settings.System.SCREEN_BRIGHTNESS_MODE
      );
      promise.resolve(brightnessModeNativeToJS(brightnessMode));
    } catch (Exception e) {
      promise.reject("ERR_BRIGHTNESS_MODE", "Failed to get the system brightness mode", e);
    }
  }

  @ExpoMethod
  public void setSystemBrightnessModeAsync(int brightnessMode, Promise promise) {
    try {
      // we have to just check this every time
      // if we try to store a value for this permission, there is no way to know if the user has changed it
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(getCurrentActivity())) {
        promise.reject("ERR_BRIGHTNESS_PERMISSIONS_DENIED", "WRITE_SETTINGS permission has not been granted");
        return;
      }
      Settings.System.putInt(
          getCurrentActivity().getContentResolver(),
          Settings.System.SCREEN_BRIGHTNESS_MODE,
          brightnessModeJSToNative(brightnessMode)
      );
      promise.resolve(null);
    } catch (InvalidArgumentException e) {
      promise.reject(e);
    } catch (Exception e) {
      promise.reject("ERR_BRIGHTNESS_MODE", "Failed to set the system brightness mode", e);
    }
  }

  private int brightnessModeNativeToJS(int nativeValue) {
    switch (nativeValue) {
      case Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC:
        return 1;
      case Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL:
        return 2;
      default:
        return 0;
    }
  }

  private int brightnessModeJSToNative(int jsValue) throws Exception {
    switch (jsValue) {
      case 1:
        return Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC;
      case 2:
        return Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL;
      default:
        throw new InvalidArgumentException("Unsupported brightness mode " + String.valueOf(jsValue));
    }
  }

  private Activity getCurrentActivity() {
    return mModuleRegistry.getModule(ActivityProvider.class).getCurrentActivity();
  }
}
