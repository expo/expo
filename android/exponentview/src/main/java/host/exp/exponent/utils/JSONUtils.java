// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;

public class JSONUtils {
  public static String getJSONString(Object item) throws JSONException {
    if (item instanceof HashMap<?, ?>) {
      return getJSONFromHashMap((HashMap<String, Object>) item).toString();
    } else if (item instanceof ArrayList<?>) {
      return getJSONFromArrayList((ArrayList<Object>) item).toString();
    }

    return String.valueOf(item);
  }

  public static JSONArray getJSONFromArrayList(ArrayList<Object> array) throws JSONException {
    JSONArray json = new JSONArray();

    for (Object value : array) {
      if (value instanceof HashMap<?, ?>) {
        value = getJSONFromHashMap((HashMap<String, Object>) value);
      } else if (value instanceof ArrayList<?>) {
        value = getJSONFromArrayList((ArrayList<Object>) value);
      }

      json.put(value);
    }

    return json;
  }

  public static JSONObject getJSONFromHashMap(HashMap<String, Object> map) throws JSONException {
    JSONObject json = new JSONObject();

    for (String key : map.keySet()) {
      Object value = map.get(key);

      if (value instanceof HashMap<?, ?>) {
        value = getJSONFromHashMap((HashMap<String, Object>) value);
      } else if (value instanceof ArrayList<?>) {
        value = getJSONFromArrayList((ArrayList<Object>) value);
      }

      json.put(key, value);
    }

    return json;
  }
}
