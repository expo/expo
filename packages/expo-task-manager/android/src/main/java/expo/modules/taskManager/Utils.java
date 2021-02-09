package expo.modules.taskManager;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.unimodules.interfaces.taskManager.TaskInterface;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class Utils {
  private static final String TAG = "taskManager.Utils";

  public static Map<String, Object> exportTaskToMap(TaskInterface task) {
    Map<String, Object> map = new HashMap<>();
    Class consumerClass = task.getConsumer().getClass();
    String consumerClassName = unversionedClassNameForClass(consumerClass);

    map.put("name", task.getName());
    map.put("consumerClass", consumerClassName);
    map.put("consumerVersion", getConsumerVersion(consumerClass));
    map.put("options", task.getOptions());

    return map;
  }

  /**
   * Returns unversioned class from versioned one.
   */
  public static Class unversionedClassForClass(Class versionedClass) {
    if (versionedClass == null) {
      return null;
    }

    String unversionedClassName = unversionedClassNameForClass(versionedClass);

    try {
      return Class.forName(unversionedClassName);
    } catch (ClassNotFoundException e) {
      Log.e(TAG, "Class with name '" + unversionedClassName + "' not found.");
      e.printStackTrace();
      return null;
    }
  }

  /**
   * Method that unversions class names, so we can always use unversioned task consumer classes.
   */
  public static String unversionedClassNameForClass(Class versionedClass) {
    String className = versionedClass.getName();
    return className.replaceFirst("\\^abi\\d+_\\d+_\\d+\\.", "");
  }

  /**
   * Returns task consumer's version. Defaults to 0 if `VERSION` static field is not implemented.
   */
  public static int getConsumerVersion(Class consumerClass) {
    try {
      Field versionField = consumerClass.getDeclaredField("VERSION");
      return (Integer) versionField.get(null);
    } catch (NoSuchFieldException | IllegalAccessException e) {
      return 0;
    }
  }

  public static Map<String, Object> jsonToMap(String jsonStr) {
    try {
      return jsonToMap(new JSONObject(jsonStr));
    } catch (JSONException e) {
      return new HashMap<>();
    }
  }

  public static Map<String, Object> jsonToMap(JSONObject json) {
    Map<String, Object> map = new HashMap<>();

    try {
      Iterator<?> keys = json.keys();

      while (keys.hasNext()) {
        String key = (String) keys.next();
        Object value = jsonObjectToObject(json.get(key));

        map.put(key, value);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return map;
  }

  public static List<Object> jsonToList(JSONArray json) {
    List<Object> list = new ArrayList<>();

    try {
      for (int i = 0; i < json.length(); i++) {
        Object value = json.get(i);

        if (value instanceof JSONArray) {
          value = jsonToList((JSONArray) value);
        } else if (value instanceof JSONObject) {
          value = jsonToMap((JSONObject) value);
        }
        list.add(value);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return list;
  }

  public static Object jsonObjectToObject(Object json) {
    if (json instanceof JSONObject) {
      return jsonToMap((JSONObject) json);
    }
    if (json instanceof JSONArray) {
      return jsonToList((JSONArray) json);
    }
    return json;
  }

}
