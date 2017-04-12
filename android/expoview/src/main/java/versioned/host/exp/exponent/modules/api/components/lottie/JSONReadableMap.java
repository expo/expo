package versioned.host.exp.exponent.modules.api.components.lottie;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.util.Iterator;
import java.util.Map;

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
  private static final String NOT_SUPPORTED_MESSAGE = "JSONReadableMap does not implement this method";

  JSONReadableMap(ReadableMap map) {
    this.map = map;
  }

  public JSONReadableMap() {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableMap(Map copyFrom) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableMap(JSONTokener readFrom) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableMap(String json) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableMap(JSONObject copyFrom, String[] names) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public int length() {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject put(String name, boolean value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject put(String name, double value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject put(String name, int value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject put(String name, long value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject put(String name, Object value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject putOpt(String name, Object value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject accumulate(String name, Object value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public Object remove(String name) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public boolean isNull(String name) {
    return map.isNull(name);
  }

  @Override
  public JSONArray toJSONArray(JSONArray names) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public Iterator<String> keys() {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray names() {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public Object opt(String name) {
    if (!map.hasKey(name)) {
      return null;
    }
    switch (map.getType(name)) {
      case Array:
        return new JSONReadableArray(map.getArray(name));
      case Map:
        return new JSONReadableMap(map.getMap(name));
      case Boolean:
        return map.getBoolean(name);
      case Number:
        try {
          return map.getInt(name);
        } catch (Exception e) {
          return map.getDouble(name);
        }
      case String:
        return map.getString(name);
      case Null:
      default:
        return null;
    }
  }

  @Override
  public boolean optBoolean(String name) {
    return optBoolean(name, false);
  }

  @Override
  public boolean optBoolean(String name, boolean fallback) {
    if (map.hasKey(name) && map.getType(name) == ReadableType.Boolean) {
      return map.getBoolean(name);
    }
    return fallback;
  }

  @Override
  public double optDouble(String name) {
    return optDouble(name, Double.NaN);
  }

  @Override
  public double optDouble(String name, double fallback) {
    if (map.hasKey(name) && map.getType(name) == ReadableType.Number) {
      return map.getDouble(name);
    }
    return fallback;
  }

  @Override
  public int optInt(String name) {
    return optInt(name, 0);
  }

  @Override
  public int optInt(String name, int fallback) {
    if (map.hasKey(name) && map.getType(name) == ReadableType.Number) {
      return map.getInt(name);
    }
    return fallback;
  }

  @Override
  public long optLong(String name) {
    return optLong(name, 0L);
  }

  @Override
  public long optLong(String name, long fallback) {
    if (map.hasKey(name) && map.getType(name) == ReadableType.Number) {
      try {
        return map.getInt(name);
      } catch (Exception e) {
        return fallback;
      }
    }
    return fallback;
  }

  @Override
  public String optString(String name) {
    return optString(name, "");
  }

  @Override
  public String optString(String name, String fallback) {
    if (map.hasKey(name) && map.getType(name) == ReadableType.String) {
      return map.getString(name);
    }
    return fallback;
  }

  @Override
  public JSONArray optJSONArray(String name) {
    if (map.hasKey(name) && map.getType(name) == ReadableType.Array) {
      return new JSONReadableArray(map.getArray(name));
    }
    return null;
  }

  @Override
  public JSONObject optJSONObject(String name) {
    if (map.hasKey(name) && map.getType(name) == ReadableType.Map) {
      return new JSONReadableMap(map.getMap(name));
    }
    return null;
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
