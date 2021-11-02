package expo.modules.core.arguments;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MapArguments implements ReadableArguments {
  private Map<String, Object> mMap;

  public MapArguments() {
    mMap = new HashMap<>();
  }

  public MapArguments(Map<String, Object> map) {
    mMap = map;
  }

  @Override
  public Collection<String> keys() {
    return mMap.keySet();
  }

  @Override
  public boolean containsKey(String key) {
    return mMap.containsKey(key);
  }

  @Override
  public Object get(String key) {
    return mMap.get(key);
  }

  @Override
  public boolean getBoolean(String key, boolean defaultValue) {
    Object value = mMap.get(key);
    if (value instanceof Boolean) {
      return (Boolean) value;
    }
    return defaultValue;
  }

  @Override
  public double getDouble(String key, double defaultValue) {
    Object value = mMap.get(key);
    if (value instanceof Number) {
      return ((Number) value).doubleValue();
    }
    return defaultValue;
  }

  @Override
  public int getInt(String key, int defaultValue) {
    Object value = mMap.get(key);
    if (value instanceof Number) {
      return ((Number) value).intValue();
    }
    return defaultValue;
  }

  @Override
  public String getString(String key, String defaultValue) {
    Object value = mMap.get(key);
    if (value instanceof String) {
      return (String) value;
    }
    return defaultValue;
  }

  @Override
  public List getList(String key, List defaultValue) {
    Object value = mMap.get(key);
    if (value instanceof List) {
      return (List) value;
    }
    return defaultValue;
  }

  @Override
  public Map getMap(String key, Map defaultValue) {
    Object value = mMap.get(key);
    if (value instanceof Map) {
      return (Map) value;
    }
    return defaultValue;
  }

  @Override
  public boolean isEmpty() {
    return mMap.isEmpty();
  }

  @Override
  public int size() {
    return mMap.size();
  }
}
