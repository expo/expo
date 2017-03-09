package abi15_0_0.host.exp.exponent.modules.api.components.lottie;

import abi15_0_0.com.facebook.react.bridge.ReadableMap;
import abi15_0_0.com.facebook.react.bridge.ReadableType;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * This class is a thin wrapper around React Native's `ReadableMap` and `ReadableArray` classes,
 * which are what React Native uses to serialize data efficiently across the bridge.
 * <p>
 * Many things in android land use `org.json.*` classes, and expect those to get passed around
 * instead when dealing with JSON (LottieAnimationView is one such example).  In an effort to be
 * efficient, this class simply subclass `JSONObject` and override all of the core methods to
 * provide a shim around a `ReadableMap`.
 * <p>
 * See also: `JSONReadableArray.java`
 */
class JSONReadableMap extends JSONObject {
  private final ReadableMap map;

  JSONReadableMap(ReadableMap map) {
    this.map = map;
  }

  @Override public boolean has(String name) {
    return map.hasKey(name);
  }

  @Override public boolean getBoolean(String name) throws JSONException {
    try {
      return map.getBoolean(name);
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public int getInt(String name) throws JSONException {
    try {
      return map.getInt(name);
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public long getLong(String name) throws JSONException {
    try {
      try {
        return (long)map.getInt(name);
      } catch (RuntimeException e) {
        return (long)map.getDouble(name);
      }
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public double getDouble(String name) throws JSONException {
    try {
      return map.getDouble(name);
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public String getString(String name) throws JSONException {
    try {
      return map.getString(name);
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public JSONArray getJSONArray(String name) throws JSONException {
    try {
      return new JSONReadableArray(map.getArray(name));
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public JSONObject getJSONObject(String name) throws JSONException {
    try {
      return new JSONReadableMap(map.getMap(name));
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public Object get(String name) throws JSONException {
    ReadableType type = map.getType(name);
    try {
      switch (type) {
        case Null:
          return null;
        case Boolean:
          return getBoolean(name);
        case Number:
          try {
            return map.getInt(name);
          } catch (RuntimeException e) {
            return map.getDouble(name);
          }
        case String:
          return getString(name);
        case Map:
          return getJSONObject(name);
        case Array:
          return getJSONArray(name);
        default:
          throw new JSONException("Could not convert object with key '" + name + "'.");
      }
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }
}
