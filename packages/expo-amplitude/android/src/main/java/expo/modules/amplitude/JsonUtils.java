package expo.modules.amplitude;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.Map;

public class JsonUtils {
  private static final String TAG = JsonUtils.class.getSimpleName();

  public static JSONObject MapToJson(Map<String, Object> map) {
    JSONObject json = new JSONObject();

    try {
      for (Map.Entry<String, Object> entry : map.entrySet())
      {
        String key = entry.getKey();
        Object value = entry.getValue();
        addObjectWithKeyToJson(key, value, json);
      }
    } catch (JSONException e) {
      // TODO
      Log.d(TAG, "Error converting ReadableMap to json: " + e.toString());
    }

    return json;
  }

  private static JSONArray ListToJson(List<Object> list) {
    JSONArray json = new JSONArray();

    try {
      for (Object value : list)
      {
        addObjectToJson(value, json);
      }
    } catch (JSONException e) {
      // TODO
      Log.d(TAG, "Error converting ReadableMap to json: " + e.toString());
    }
    return json;
  }

  private static void addObjectWithKeyToJson(String key, Object value, JSONObject json) throws JSONException {
    if (value == null) {
      json.put(key, null);
    } else if (value instanceof Boolean) {
      json.put(key, (Boolean)value);
    } else if (value instanceof Number) {
      json.put(key, ((Number)(value)).doubleValue());
    } else if (value instanceof String) {
      json.put(key, (String)value);
    } else if (value instanceof Map) {
      json.put(key, MapToJson((Map<String, Object>)value));
    } else if (value instanceof List) {
      json.put(key, ListToJson((List<Object>)value));
    }
  }

  private static void addObjectToJson(Object value, JSONArray json) throws JSONException {
    if (value == null) {
      json.put(null);
    } else if (value instanceof Boolean) {
      json.put((Boolean)value);
    } else if (value instanceof Number) {
      json.put(((Number)(value)).doubleValue());
    } else if (value instanceof String) {
      json.put((String)value);
    } else if (value instanceof Map) {
      json.put(MapToJson((Map<String, Object>)value));
    } else if (value instanceof List) {
      json.put(ListToJson((List<Object>)value));
    }
  }
}
