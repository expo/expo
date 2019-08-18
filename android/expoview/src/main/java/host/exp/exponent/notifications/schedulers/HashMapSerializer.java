package host.exp.exponent.notifications.schedulers;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

public class HashMapSerializer {

  public static String serialize(HashMap<String, Object> map) {
    JSONObject serialized = new JSONObject(map);
    return serialized.toString();
  }

  public static HashMap<String, Object> deserialize(String serializedMap) throws JSONException {
    JSONObject serialized = null;
    try {
      serialized = new JSONObject(serializedMap);
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return (HashMap<String, Object>)jsonToMap(serialized);
  }

  public static HashMap<String, Object> jsonToMap(JSONObject json) throws JSONException {
    HashMap<String, Object> retMap = new HashMap<String, Object>();

    if(json != JSONObject.NULL) {
      retMap = toMap(json);
    }
    return retMap;
  }

  public static HashMap<String, Object> toMap(JSONObject object) throws JSONException {
    HashMap<String, Object> map = new HashMap<String, Object>();

    Iterator<String> keysItr = object.keys();
    while(keysItr.hasNext()) {
      String key = keysItr.next();
      Object value = object.get(key);

      if(value instanceof JSONArray) {
        value = toList((JSONArray) value);
      }

      else if(value instanceof JSONObject) {
        value = toMap((JSONObject) value);
      }
      map.put(key, value);
    }
    return map;
  }

  public static List<Object> toList(JSONArray array) throws JSONException {
    List<Object> list = new ArrayList<Object>();
    for(int i = 0; i < array.length(); i++) {
      Object value = array.get(i);
      if(value instanceof JSONArray) {
        value = toList((JSONArray) value);
      }

      else if(value instanceof JSONObject) {
        value = toMap((JSONObject) value);
      }
      list.add(value);
    }
    return list;
  }
}
