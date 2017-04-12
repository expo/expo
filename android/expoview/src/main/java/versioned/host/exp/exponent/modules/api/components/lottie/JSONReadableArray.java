package versioned.host.exp.exponent.modules.api.components.lottie;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.util.Collection;

import static com.facebook.react.bridge.ReadableType.Array;

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
  private static final String NOT_SUPPORTED_MESSAGE = "JSONReadableArray does not implement this method";

  JSONReadableArray(ReadableArray array) {
    this.array = array;
    // see description for why this is needed.
    cache = new Object[array.size()];
  }

  public JSONReadableArray() {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableArray(Collection copyFrom) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableArray(JSONTokener readFrom) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableArray(String json) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  public JSONReadableArray(Object array) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(boolean value) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(double value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(int value) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(long value) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(Object value) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(int index, boolean value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(int index, double value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(int index, int value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(int index, long value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONArray put(int index, Object value) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public Object remove(int index) {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public JSONObject toJSONObject(JSONArray names) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public String join(String separator) throws JSONException {
    throw new UnsupportedOperationException(NOT_SUPPORTED_MESSAGE);
  }

  @Override
  public boolean isNull(int index) {
    return array.isNull(index);
  }

  @Override
  public Object opt(int index) {
    if (index >= array.size()) {
      return null;
    }
    try {
      switch (array.getType(index)) {
        case Array:
          return getJSONArray(index);
        case Map:
          return getJSONObject(index);
        case Boolean:
          return getBoolean(index);
        case Number:
          try {
            return getInt(index);
          } catch (Exception e) {
            return getDouble(index);
          }
        case String:
          return getString(index);
        case Null:
        default:
          return null;
      }
    } catch (JSONException e) {
      return null;
    }
  }

  @Override
  public boolean optBoolean(int index) {
    return optBoolean(index, false);
  }

  @Override
  public boolean optBoolean(int index, boolean fallback) {
    if (index < array.size() && array.getType(index) == ReadableType.Boolean) {
      try {
        return getBoolean(index);
      } catch (JSONException e) {
        return fallback;
      }
    }
    return fallback;
  }

  @Override
  public double optDouble(int index) {
    return optDouble(index, Double.NaN);
  }

  @Override
  public double optDouble(int index, double fallback) {
    if (index < array.size() && array.getType(index) == ReadableType.Number) {
      try {
        return getDouble(index);
      } catch (JSONException e) {
        return fallback;
      }
    }
    return fallback;
  }

  @Override
  public int optInt(int index) {
    return optInt(index, 0);
  }

  @Override
  public int optInt(int index, int fallback) {
    if (index < array.size() && array.getType(index) == ReadableType.Number) {
      try {
        return getInt(index);
      } catch (JSONException e) {
        return fallback;
      }
    }
    return fallback;
  }

  @Override
  public long optLong(int index) {
    return optLong(index, 0L);
  }

  @Override
  public long optLong(int index, long fallback) {
    if (index < array.size() && array.getType(index) == ReadableType.Number) {
      try {
        return getLong(index);
      } catch (JSONException e) {
        return fallback;
      }
    }
    return fallback;
  }

  @Override
  public String optString(int index) {
    return optString(index, "");
  }

  @Override
  public String optString(int index, String fallback) {
    if (index < array.size() && array.getType(index) == ReadableType.String) {
      try {
        return getString(index);
      } catch (JSONException e) {
        return fallback;
      }
    }
    return fallback;
  }

  @Override
  public JSONArray optJSONArray(int index) {
    if (index < array.size() && array.getType(index) == Array) {
      try {
        return getJSONArray(index);
      } catch (JSONException e) {
        return null;
      }
    }
    return null;
  }

  @Override
  public JSONObject optJSONObject(int index) {
    if (index < array.size() && array.getType(index) == ReadableType.Map) {
      try {
        return getJSONObject(index);
      } catch (JSONException e) {
        return null;
      }
    }
    return null;
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
