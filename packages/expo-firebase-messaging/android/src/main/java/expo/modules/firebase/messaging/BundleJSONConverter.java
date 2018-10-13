package expo.modules.firebase.messaging;

// taken from https://github.com/facebook/facebook-android-sdk/blob/master/facebook/src/main/java/com/facebook/internal/BundleJSONConverter.java

/*
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 * <p>
 * You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
 * copy, modify, and distribute this software in source code or binary form for use
 * in connection with the web services and APIs provided by Facebook.
 * <p>
 * As with any software that integrates with the Facebook platform, your use of
 * this software is subject to the Facebook Developer Principles and Policies
 * [http://developers.facebook.com/policy/]. This copyright notice shall be
 * included in all copies or substantial portions of the software.
 * <p>
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import android.os.Bundle;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * com.facebook.internal is solely for the use of other packages within the
 * Facebook SDK for Android. Use of any of the classes in this package is
 * unsupported, and they may be modified or removed without warning at any time.
 *
 * A helper class that can round trip between JSON and Bundle objects that
 * contains the types: Boolean, Integer, Long, Double, String If other types are
 * found, an IllegalArgumentException is thrown.
 */
public class BundleJSONConverter {
  private static final Map<Class<?>, Setter> SETTERS = new HashMap<>();

  static {
    SETTERS.put(Boolean.class, new Setter() {
      public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException {
        bundle.putBoolean(key, (Boolean) value);
      }

      public void setOnJSON(JSONObject json, String key, Object value) throws JSONException {
        json.put(key, value);
      }
    });
    SETTERS.put(Integer.class, new Setter() {
      public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException {
        bundle.putInt(key, (Integer) value);
      }

      public void setOnJSON(JSONObject json, String key, Object value) throws JSONException {
        json.put(key, value);
      }
    });
    SETTERS.put(Long.class, new Setter() {
      public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException {
        bundle.putLong(key, (Long) value);
      }

      public void setOnJSON(JSONObject json, String key, Object value) throws JSONException {
        json.put(key, value);
      }
    });
    SETTERS.put(Double.class, new Setter() {
      public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException {
        bundle.putDouble(key, (Double) value);
      }

      public void setOnJSON(JSONObject json, String key, Object value) throws JSONException {
        json.put(key, value);
      }
    });
    SETTERS.put(String.class, new Setter() {
      public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException {
        bundle.putString(key, (String) value);
      }

      public void setOnJSON(JSONObject json, String key, Object value) throws JSONException {
        json.put(key, value);
      }
    });
    SETTERS.put(String[].class, new Setter() {
      public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException {
        throw new IllegalArgumentException("Unexpected type from JSON");
      }

      public void setOnJSON(JSONObject json, String key, Object value) throws JSONException {
        JSONArray jsonArray = new JSONArray();
        for (String stringValue : (String[]) value) {
          jsonArray.put(stringValue);
        }
        json.put(key, jsonArray);
      }
    });

    SETTERS.put(JSONArray.class, new Setter() {
      public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException {
        JSONArray jsonArray = (JSONArray) value;
        // Assume an empty list is an ArrayList<String>
        if (jsonArray.length() == 0 || jsonArray.get(0) instanceof String) {
          ArrayList<String> stringArrayList = new ArrayList<>();
          for (int i = 0; i < jsonArray.length(); i++) {
            stringArrayList.add((String) jsonArray.get(i));
          }
          bundle.putStringArrayList(key, stringArrayList);
        } else if (jsonArray.get(0) instanceof Integer) {
          ArrayList<Integer> integerArrayList = new ArrayList<>();
          for (int i = 0; i < jsonArray.length(); i++) {
            integerArrayList.add((Integer) jsonArray.get(i));
          }
          bundle.putIntegerArrayList(key, integerArrayList);
        } else if (jsonArray.get(0) instanceof Boolean) {
          boolean[] booleanArray = new boolean[jsonArray.length()];
          for (int i = 0; i < jsonArray.length(); i++) {
            booleanArray[i] = (Boolean) jsonArray.get(i);
          }
          bundle.putBooleanArray(key, booleanArray);
        } else if (jsonArray.get(0) instanceof Double) {
          double[] doubleArray = new double[jsonArray.length()];
          for (int i = 0; i < jsonArray.length(); i++) {
            doubleArray[i] = (Double) jsonArray.get(i);
          }
          bundle.putDoubleArray(key, doubleArray);
        } else if (jsonArray.get(0) instanceof Long) {
          long[] longArray = new long[jsonArray.length()];
          for (int i = 0; i < jsonArray.length(); i++) {
            longArray[i] = (Long) jsonArray.get(i);
          }
          bundle.putLongArray(key, longArray);
        } else if (jsonArray.get(0) instanceof JSONObject) {
          ArrayList<Bundle> bundleArrayList = new ArrayList<>();
          for (int i = 0; i < jsonArray.length(); i++) {
            bundleArrayList.add(convertToBundle((JSONObject) jsonArray.get(i)));
          }
          bundle.putSerializable(key, bundleArrayList);
        } else {
          throw new IllegalArgumentException("Unexpected type in an array: " + jsonArray.get(0).getClass());
        }
      }

      @Override
      public void setOnJSON(JSONObject json, String key, Object value) throws JSONException {
        throw new IllegalArgumentException("JSONArray's are not supported in bundles.");
      }
    });
  }

  public interface Setter {
    public void setOnBundle(Bundle bundle, String key, Object value) throws JSONException;

    public void setOnJSON(JSONObject json, String key, Object value) throws JSONException;
  }

  public static JSONObject convertToJSON(Bundle bundle) throws JSONException {
    JSONObject json = new JSONObject();

    for (String key : bundle.keySet()) {
      Object value = bundle.get(key);
      if (value == null) {
        // Null is not supported.
        continue;
      }

      // Special case List<?> as getClass would not work, since List is an interface
      if (value instanceof List<?>) {
        JSONArray jsonArray = new JSONArray();
        List<Object> listValue = (List<Object>) value;
        for (Object objValue : listValue) {
          if (objValue instanceof String || objValue instanceof Integer || objValue instanceof Double
              || objValue instanceof Long || objValue instanceof Boolean) {
            jsonArray.put(objValue);
          } else if (objValue instanceof Bundle) {
            jsonArray.put(convertToJSON((Bundle) objValue));
          } else {
            throw new IllegalArgumentException("Unsupported type: " + objValue.getClass());
          }
        }
        json.put(key, jsonArray);
        continue;
      }

      // Special case Bundle as it's one way, on the return it will be JSONObject
      if (value instanceof Bundle) {
        json.put(key, convertToJSON((Bundle) value));
        continue;
      }

      Setter setter = SETTERS.get(value.getClass());
      if (setter == null) {
        throw new IllegalArgumentException("Unsupported type: " + value.getClass());
      }
      setter.setOnJSON(json, key, value);
    }

    return json;
  }

  public static Bundle convertToBundle(JSONObject jsonObject) throws JSONException {
    Bundle bundle = new Bundle();
    @SuppressWarnings("unchecked")
    Iterator<String> jsonIterator = jsonObject.keys();
    while (jsonIterator.hasNext()) {
      String key = jsonIterator.next();
      Object value = jsonObject.get(key);
      if (value == null || value == JSONObject.NULL) {
        // Null is not supported.
        continue;
      }

      // Special case JSONObject as it's one way, on the return it would be Bundle.
      if (value instanceof JSONObject) {
        bundle.putBundle(key, convertToBundle((JSONObject) value));
        continue;
      }

      Setter setter = SETTERS.get(value.getClass());
      if (setter == null) {
        throw new IllegalArgumentException("Unsupported type: " + value.getClass());
      }
      setter.setOnBundle(bundle, key, value);
    }

    return bundle;
  }
}
