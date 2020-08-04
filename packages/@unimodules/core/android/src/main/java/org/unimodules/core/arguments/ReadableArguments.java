package org.unimodules.core.arguments;

import android.os.Bundle;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface ReadableArguments {
  Collection<String> keys();

  boolean containsKey(String key);

  Object get(String key);

  default boolean getBoolean(String key) {
    return getBoolean(key, false);
  }

  boolean getBoolean(String key, boolean defaultValue);

  default double getDouble(String key) {
    return getDouble(key, 0);
  }

  double getDouble(String key, double defaultValue);

  default int getInt(String key) {
    return getInt(key, 0);
  }

  int getInt(String key, int defaultValue);

  default String getString(String key) {
    return getString(key, null);
  }

  String getString(String key, String defaultValue);

  default List getList(String key) {
    return getList(key, null);
  }

  List getList(String key, List defaultValue);

  default Map getMap(String key) {
    return getMap(key, null);
  }

  Map getMap(String key, Map defaultValue);

  @SuppressWarnings("unchecked")
  default ReadableArguments getArguments(String key) {
    Object value = get(key);
    if (value instanceof Map) {
      return new MapArguments((Map) value);
    }
    return null;
  }

  boolean isEmpty();

  int size();

  default Bundle toBundle() {
    Bundle bundle = new Bundle();
    for (String key : keys()) {
      Object value = get(key);
      if (value == null) {
        bundle.putString(key, null);
      } else if (value instanceof String) {
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
      } else if (value instanceof Bundle) {
        bundle.putBundle(key, (Bundle) value);
      } else {
        throw new UnsupportedOperationException("Could not put a value of " + value.getClass() + " to bundle.");
      }
    }
    return bundle;
  }
}
