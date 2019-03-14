package org.unimodules.core;

import java.util.List;
import java.util.Map;

import org.unimodules.core.interfaces.Arguments;

public class MapHelper implements Arguments {
  private Map mMap;

  public MapHelper(Map map) {
    super();
    mMap = map;
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
  public boolean getBoolean(String key) {
    return getBoolean(key, false);
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
  public double getDouble(String key) {
    return getDouble(key, 0);
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
  public int getInt(String key) {
    return getInt(key, 0);
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
  public long getLong(String key) {
    return getLong(key, 0);
  }

  @Override
  public long getLong(String key, long defaultValue) {
    Object value = mMap.get(key);
    if (value instanceof Number) {
      return ((Number) value).longValue();
    }
    return defaultValue;
  }

  @Override
  public String getString(String key) {
    return getString(key, null);
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
  public List getList(String key) {
    return getList(key, null);
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
  public Map getMap(String key) {
    return getMap(key, null);
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

  @Override
  public Arguments getArguments(String key) {
    Map value = getMap(key);
    if (value != null) {
      return new MapHelper(value);
    }
    return null;
  }
}
