package expo.modules.firebase.app;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Bundle;
import android.os.Parcelable;
import android.support.annotation.Nullable;
import android.util.Log;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;


import expo.core.ModuleRegistry;
import expo.core.interfaces.services.EventEmitter;

@SuppressWarnings("WeakerAccess")
public class Utils {
  private static final String TAG = "Utils";

  public static String timestampToUTC(long timestamp) {
    Calendar calendar = Calendar.getInstance();
    Date date = new Date((timestamp + calendar.getTimeZone().getOffset(timestamp)) * 1000);
    SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
    format.setTimeZone(TimeZone.getTimeZone("UTC"));
    return format.format(date);
  }

  /**
   * send a JS event
   **/
  public static void sendEvent(final ModuleRegistry mModuleRegistry, final String eventName, Bundle body) {
    if (mModuleRegistry != null ) {
      EventEmitter eventEmitter = mModuleRegistry.getModule(EventEmitter.class);
      if (eventEmitter != null) {
        eventEmitter.emit(eventName, body);
        return;
      }
    } 
    String errorMessage = "Could not emit " + eventName + " event, no event emitter or module registry present.";
    Log.e(TAG, errorMessage);
    // throw new NullPointerException(errorMessage); 
  }

  /**
   * Takes a value and calls the appropriate setter for its type on the target map
   * + key
   *
   * @param key   String key to set on target map
   * @param value Object value to set on target map
   * @param map   Bundle target map to write the value to
   */
  @SuppressWarnings("unchecked")
  public static void mapPutValue(String key, @Nullable Object value, Bundle map) {
    if (value == null) {
      map.putString(key, (String) value);
    } else {
      String type = value.getClass().getName();
      switch (type) {
      case "java.lang.Boolean":
        map.putBoolean(key, (Boolean) value);
        break;
      case "java.lang.Long":
        Long longVal = (Long) value;
        map.putLong(key, longVal);
        break;
      case "java.lang.Float":
        float floatVal = (float) value;
        map.putFloat(key, floatVal);
        break;
      case "java.lang.Double":
        map.putDouble(key, (Double) value);
        break;
      case "java.lang.Integer":
        map.putInt(key, (int) value);
        break;
      case "java.lang.String":
        map.putString(key, (String) value);
        break;
      case "org.json.JSONObject$1":
        map.putString(key, value.toString());
        break;
      case "android.os.Bundle":
        map.putBundle(key, (Bundle) value);
        break;
      default:
        if (List.class.isAssignableFrom(value.getClass())) {
          ArrayList nList = new ArrayList();
          for (Object item : (List) value) {
            if (item != null && Map.class.isAssignableFrom(item.getClass())) {
              Map<String, Object> valueMap = (Map<String, Object>) item;
              nList.add(bundleToMap(valueMap));
            } else {
              nList.add(item);
            }
          }
          map.putParcelableArrayList(key, (ArrayList<? extends Parcelable>) nList);
        } else if (Map.class.isAssignableFrom(value.getClass())) {
          Map<String, Object> valueMap = (Map<String, Object>) value;
          map.putBundle(key, bundleToMap(valueMap));
        } else {
          Log.d(TAG, "utils:mapPutValue:unknownType:" + type);
          map.remove(key);
        }
      }
    }
  }

  /**
   * Convert a ReadableMap to a Bundle for the purposes of re-sending back to
   * JS TODO This is now a legacy util - internally uses RN functionality
   *
   * @param map ReadableMap
   * @return Bundle
   */
  public static Bundle bundleToMap(Map<String, Object> map) {
    Bundle bundle = new Bundle();
    for (Map.Entry<String, Object> entry : map.entrySet()) {

      String key = entry.getKey();
      Object value = entry.getValue();

      mapPutValue(key, value, bundle);
    }
    return bundle;
  }

  /**
   * We need to check if app is in foreground otherwise the app will crash.
   * http://stackoverflow.com/questions/8489993/check-android-application-is-in-foreground-or-not
   *
   * @param context Context
   * @return boolean
   */
  public static boolean isAppInForeground(Context context) {
    ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
    if (activityManager == null) {
      return false;
    }

    List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
    if (appProcesses == null) {
      return false;
    }
    
    final String packageName = context.getPackageName();
    for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
      if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
          && appProcess.processName.equals(packageName)) {
        return true;
      }
    }

    return false;
  }

  public static int getResId(Context ctx, String resName) {
    int resourceId = ctx.getResources().getIdentifier(resName, "string", ctx.getPackageName());
    if (resourceId == 0) {
      Log.e(TAG, "resource " + resName + " could not be found");
    }
    return resourceId;
  }
}
