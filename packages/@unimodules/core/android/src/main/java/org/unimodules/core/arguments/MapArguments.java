package org.unimodules.core.arguments;

import android.os.Bundle;

import java.util.ArrayList;
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
  public ReadableArguments getArguments(String key) {
    Map value = getMap(key);
    if (value != null) {
      return new MapArguments(value);
    }
    return null;
  }

  @Override
  public Bundle toBundle() {
    Bundle bundle = new Bundle();
    for (String key : mMap.keySet()) {
      Object value = mMap.get(key);
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
        bundle.putBundle(key, new MapArguments((Map) value).toBundle());
      } else {
        throw new UnsupportedOperationException("Could not put a value of " + value.getClass() + " to bundle.");
      }
    }
    return bundle;
  }
}
