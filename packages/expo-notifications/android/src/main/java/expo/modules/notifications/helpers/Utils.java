package expo.modules.notifications.helpers;

import android.os.Build;
import android.os.Bundle;

import org.json.JSONException;
import org.unimodules.core.arguments.MapArguments;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class Utils {

  public static boolean isAndroidVersionBelowOreo() {
    return !(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O);
  }

  public static Bundle convertMapToBundle(Map<String, Object> map) {
    Bundle bundle = new Bundle();
    for (String key : map.keySet()) {

      Object value = map.get(key);
      if (value == null) {
        continue;
      }

      if (value instanceof String) {
        bundle.putString(key, (String) value);
      } else if (value instanceof Integer) {
        bundle.putInt(key, (Integer) value);
      } else if (value instanceof Double) {
        bundle.putDouble(key, (Double) value);
      } else if (value instanceof Long) {
        bundle.putLong(key, (Long) value);
      } else if (value instanceof Boolean) {
        bundle.putBoolean(key, (Boolean) value);
      } else if (value instanceof ArrayList) {
        bundle.putParcelableArrayList(key, (ArrayList) value);
      } else if (value instanceof Map) {
        bundle.putBundle(key, convertMapToBundle((Map<String, Object>) value));
      } else {
        throw new UnsupportedOperationException("Could not put a value of " + value.getClass() + " to bundle.");
      }
    }
    return bundle;
  }

  public static HashMap<String, Object> convertBundleToMap(Bundle bundle) {
    HashMap<String, Object> map = new HashMap<>();
    for (String key : bundle.keySet()) {
      Object obj = bundle.get(key);
      if (bundle.get(key) instanceof Bundle) {
        obj = convertBundleToMap((Bundle) bundle.get(key));
      }
      map.put(key, obj);
    }
    return map;
  }

  public static String bundleToString(Bundle bundle) {
    HashMap<String, Object> map = convertBundleToMap(bundle);
    return HashMapSerializer.serialize(map);
  }

  public static Bundle StringToBundle(String string) {
    HashMap<String, Object> map = HashMapSerializer.deserialize(string);
    return convertMapToBundle(map);
  }

}
