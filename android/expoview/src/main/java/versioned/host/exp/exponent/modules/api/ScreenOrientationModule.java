package versioned.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.util.DisplayMetrics;
import android.view.Surface;
import android.view.WindowManager;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import javax.annotation.Nullable;

public class ScreenOrientationModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private @Nullable
  Integer mInitialOrientation = null;

  public ScreenOrientationModule(ReactApplicationContext reactContext) {
    super(reactContext);

    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "ExpoScreenOrientation";
  }

  //TODO: think abt this
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

  @ReactMethod
  public void lockAsync(String orientationLock, Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject(ANDROID_NO_ACTIVITY, ANDROID_NO_ACTIVITY_MSG);
      return;
    }

    try {
      int orientationAttr = convertToOrientationAttr(orientationLock);
      activity.setRequestedOrientation(orientationAttr);
    } catch (JSApplicationIllegalArgumentException e) {
      promise.reject(ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK, ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK_MSG);
      return;
    } catch (Exception e) {
      promise.reject(GENERIC_ANDROID_ERROR, e.toString());
      return;
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void lockPlatformAsync(int orientationAttr, Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject(ANDROID_NO_ACTIVITY, ANDROID_NO_ACTIVITY_MSG);
      return;
    }

    try {
      activity.setRequestedOrientation(orientationAttr);
    } catch (Exception e) {
      promise.reject(GENERIC_ANDROID_ERROR, e.toString());
      return;
    }
    promise.resolve(null);

  }

  @ReactMethod
  public void unlockAsync(Promise promise) {
    lockAsync(DEFAULT, promise);
  }

  @ReactMethod
  public void getOrientationAsync(Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject(ANDROID_NO_ACTIVITY, ANDROID_NO_ACTIVITY_MSG);
      return;
    }

    try {
      promise.resolve(getScreenOrientation(activity));
    } catch (IllegalStateException e) {
      // We don't know what the screen orientation is from surface rotation
      promise.resolve(UNKNOWN);
    } catch (Exception e) {
      promise.reject(GENERIC_ANDROID_ERROR, e.toString());
    }
  }

  @ReactMethod
  public void getOrientationLockAsync(Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject(ANDROID_NO_ACTIVITY, ANDROID_NO_ACTIVITY_MSG);
      return;
    }

    int orientationAttr = activity.getRequestedOrientation();
    promise.resolve(convertToOrientationLock(orientationAttr));
  }

  @ReactMethod
  public void getOrientationLockPlatformAsync(Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject(ANDROID_NO_ACTIVITY, ANDROID_NO_ACTIVITY_MSG);
      return;
    }

    promise.resolve(activity.getRequestedOrientation());
  }

  // https://stackoverflow.com/questions/10380989/how-do-i-get-the-current-orientation-activityinfo-screen-orientation-of-an-a
  // Will not work in all cases as surface rotation is not standardized across android devices, but this is best effort
  private String getScreenOrientation(Activity activity) throws IllegalStateException {
    WindowManager windowManager = activity.getWindowManager();
    int rotation = windowManager.getDefaultDisplay().getRotation();
    DisplayMetrics dm = new DisplayMetrics();
    windowManager.getDefaultDisplay().getMetrics(dm);
    int width = dm.widthPixels;
    int height = dm.heightPixels;
    String orientation;
    // if the device's natural orientation is portrait:
    if ((rotation == Surface.ROTATION_0
        || rotation == Surface.ROTATION_180) && height > width ||
        (rotation == Surface.ROTATION_90
            || rotation == Surface.ROTATION_270) && width > height) {
      switch (rotation) {
        case Surface.ROTATION_0:
          orientation = PORTRAIT_UP;
          break;
        case Surface.ROTATION_90:
          orientation = LANDSCAPE_LEFT;
          break;
        case Surface.ROTATION_180:
          orientation = PORTRAIT_DOWN;
          break;
        case Surface.ROTATION_270:
          orientation = LANDSCAPE_RIGHT;
          break;
        default:
          throw new IllegalStateException("Unknown screen orientation.");
      }
    }

    // if the device's natural orientation is landscape or if the device
    // is square:
    else {
      switch (rotation) {
        case Surface.ROTATION_0:
          orientation = LANDSCAPE_LEFT;
          break;
        case Surface.ROTATION_90:
          orientation = PORTRAIT_UP;
          break;
        case Surface.ROTATION_180:
          orientation = LANDSCAPE_RIGHT;
          break;
        case Surface.ROTATION_270:
          orientation = LANDSCAPE_RIGHT;
          break;
        default:
          throw new IllegalStateException("Unknown screen orientation.");
      }
    }

    return orientation;
  }

  // TODO: is there a shared place to put these things
  static final String ANDROID_NO_ACTIVITY = "ANDROID_NO_ACTIVITY";
  static final String ANDROID_NO_ACTIVITY_MSG = "There is no current activity available.";
  static final String GENERIC_ANDROID_ERROR = "GENERIC_ANDROID_ERROR";

  static final String ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK";
  static final String ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK_MSG = "an invalid OrientationLock was passed in";

  static final String UNKNOWN = "UNKNOWN";
  static final String DEFAULT = "DEFAULT";
  static final String ALL = "ALL";
  static final String ALL_BUT_UPSIDE_DOWN = "ALL_BUT_UPSIDE_DOWN";
  static final String PORTRAIT = "PORTRAIT";
  static final String PORTRAIT_UP = "PORTRAIT_UP";
  static final String PORTRAIT_DOWN = "PORTRAIT_DOWN";
  static final String LANDSCAPE = "LANDSCAPE";
  static final String LANDSCAPE_LEFT = "LANDSCAPE_LEFT";
  static final String LANDSCAPE_RIGHT = "LANDSCAPE_RIGHT";
  static final String OTHER = "OTHER";

  private String convertToOrientationLock(int orientationAttr) {
    switch (orientationAttr) {
      case ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED:
        return DEFAULT;
      case ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR:
        return ALL;
      case ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT:
        return PORTRAIT;
      case ActivityInfo.SCREEN_ORIENTATION_PORTRAIT:
        return PORTRAIT_UP;
      case ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT:
        return PORTRAIT_DOWN;
      case ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE:
        return LANDSCAPE;
      case ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE:
        return LANDSCAPE_LEFT;
      case ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE:
        return LANDSCAPE_RIGHT;
      default:
        return OTHER;
    }
  }

  private int convertToOrientationAttr(String orientationLock) throws JSApplicationIllegalArgumentException {
    switch (orientationLock) {
      case DEFAULT:
        return ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
      case ALL:
        return ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR;
      case ALL_BUT_UPSIDE_DOWN:
        return ActivityInfo.SCREEN_ORIENTATION_SENSOR;
      case PORTRAIT:
        return ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;
      case PORTRAIT_UP:
        return ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
      case PORTRAIT_DOWN:
        return ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT;
      case LANDSCAPE:
        return ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
      case LANDSCAPE_LEFT:
        return ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
      case LANDSCAPE_RIGHT:
        return ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE;
      default:
        throw new JSApplicationIllegalArgumentException("Invalid screen orientation " + orientationLock);
    }
  }
}

