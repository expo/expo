package abi15_0_0.host.exp.exponent.modules.api.components.lottie;

import abi15_0_0.com.facebook.react.bridge.ReadableArray;
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
 * efficient, theis class simply subclass `JSONArray` and override all of the core methods to
 * provide a shim around a `ReadableArray`.
 * <p>
 * IMPORTANT NOTE:
 * You may notice that this class does a lot of extra work with a `cache` array. The reason this is
 * done is because there is a bug in `ReadableArray` in the current version of React Native that
 * causes elements of the array to only ever be accessed once. In order to get around this bug, we
 * simply cache the result whenever an item is indexed. This causes some interesting complexity with
 * numbers. Any time we are accessing a numeric value from the array, we access it and cache it as a
 * `Double` (which will always succeed with JSON), and then try to convert it to the corresponding
 * numeric type in this class instead.  I'm hoping we can simplify this code whenever we upgrade
 * React Native.
 * <p>
 * See also: `JSONReadableMap.java`
 */
class JSONReadableArray extends JSONArray {
  private final ReadableArray array;
  private final Object[] cache;

  JSONReadableArray(ReadableArray array) {
    this.array = array;
    // see description for why this is needed.
    cache = new Object[array.size()];
  }

  @Override public int length() {
    return array.size();
  }

  @Override public JSONObject getJSONObject(int index) throws JSONException {
    if (cache[index] != null) {
      return (JSONReadableMap) cache[index];
    }
    try {
      JSONReadableMap val = new JSONReadableMap(array.getMap(index));
      cache[index] = val;
      return val;
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public JSONArray getJSONArray(int index) throws JSONException {
    if (cache[index] != null) {
      return (JSONReadableArray) cache[index];
    }
    try {
      JSONReadableArray val = new JSONReadableArray(array.getArray(index));
      cache[index] = val;
      return val;
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public String getString(int index) throws JSONException {
    if (cache[index] != null) {
      return (String) cache[index];
    }
    try {
      String val = array.getString(index);
      cache[index] = val;
      return val;
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public double getDouble(int index) throws JSONException {
    if (cache[index] != null) {
      return (Double) cache[index];
    }
    try {
      Double val = array.getDouble(index);
      cache[index] = val;
      return val;
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public int getInt(int index) throws JSONException {
    if (cache[index] != null) {
      Object val = cache[index];
      if (val instanceof Double) {
        return ((Double) val).intValue();
      }
    }
    try {
      Double val = array.getDouble(index);
      cache[index] = val;
      return val.intValue();
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public long getLong(int index) throws JSONException {
    if (cache[index] != null) {
      Object val = cache[index];
      if (val instanceof Double) {
        return ((Double) val).longValue();
      }
    }
    try {
      Double val = array.getDouble(index);
      cache[index] = val;
      return val.longValue();
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public boolean getBoolean(int index) throws JSONException {
    if (cache[index] != null) {
      return (Boolean) cache[index];
    }
    try {
      Boolean val = array.getBoolean(index);
      cache[index] = val;
      return val;
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }

  @Override public Object get(int index) throws JSONException {
    if (cache[index] != null) {
      return cache[index];
    }
    ReadableType type = array.getType(index);
    try {
      Object val;
      switch (type) {
        case Null:
          val = null;
          break;
        case Boolean:
          val = array.getBoolean(index);
          break;
        case Number:
          Double dbl = array.getDouble(index);
          cache[index] = dbl;
          if ((dbl == Math.floor(dbl)) && !Double.isInfinite(dbl)) {
            // integral type
            return dbl.intValue();
          } else {
            return dbl;
          }
        case String:
          val = array.getString(index);
          break;
        case Map:
          val = new JSONReadableMap(array.getMap(index));
          break;
        case Array:
          val = new JSONReadableArray(array.getArray(index));
          break;
        default:
          throw new JSONException("Could not convert object");
      }
      cache[index] = val;
      return val;
    } catch (RuntimeException e) {
      throw new JSONException(e.getMessage());
    }
  }
}
