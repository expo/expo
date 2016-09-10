// Copyright 2015-present 650 Industries. All rights reserved.

package abi10_0_0.host.exp.exponent;

import abi10_0_0.com.facebook.react.bridge.ReadableArray;
import abi10_0_0.com.facebook.react.bridge.ReadableMap;
import abi10_0_0.com.facebook.react.bridge.ReadableMapKeySetIterator;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import host.exp.exponent.analytics.EXL;

public class ReadableObjectUtils {

  private static final String TAG = ReadableObjectUtils.class.getSimpleName();

  public static JSONObject readableMapToJson(ReadableMap map) {
    // TODO: maybe leverage Arguments.toBundle somehow?
    JSONObject json = new JSONObject();

    try {
      ReadableMapKeySetIterator iterator = map.keySetIterator();
      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        switch (map.getType(key)) {
          case Null:
            json.put(key, null);
            break;
          case Boolean:
            json.put(key, map.getBoolean(key));
            break;
          case Number:
            json.put(key, map.getDouble(key));
            break;
          case String:
            json.put(key, map.getString(key));
            break;
          case Map:
            json.put(key, readableMapToJson(map.getMap(key)));
            break;
          case Array:
            json.put(key, readableArrayToJson(map.getArray(key)));
            break;
        }
      }
    } catch (JSONException e) {
      // TODO
      EXL.d(TAG, "Error converting ReadableMap to json: " + e.toString());
    }

    return json;
  }

  public static JSONArray readableArrayToJson(ReadableArray array) {
    // TODO: maybe leverage Arguments.toBundle somehow?
    JSONArray json = new JSONArray();

    try {
      for (int i = 0; i < array.size(); i++) {
        switch (array.getType(i)) {
          case Null:
            json.put(null);
            break;
          case Boolean:
            json.put(array.getBoolean(i));
            break;
          case Number:
            json.put(array.getDouble(i));
            break;
          case String:
            json.put(array.getString(i));
            break;
          case Map:
            json.put(readableMapToJson(array.getMap(i)));
            break;
          case Array:
            json.put(readableArrayToJson(array.getArray(i)));
            break;
        }
      }
    } catch (JSONException e) {
      // TODO
      EXL.d(TAG, "Error converting ReadableArray to json: " + e.toString());
    }

    return json;
  }
}
