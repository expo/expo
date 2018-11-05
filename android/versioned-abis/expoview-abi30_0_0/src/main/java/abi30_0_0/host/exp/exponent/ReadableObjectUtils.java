// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent;

import abi30_0_0.com.facebook.react.bridge.Arguments;
import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.ReadableMapKeySetIterator;
import abi30_0_0.com.facebook.react.bridge.WritableArray;
import abi30_0_0.com.facebook.react.bridge.WritableMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

import host.exp.exponent.analytics.EXL;

public class ReadableObjectUtils {

  private static final String TAG = ReadableObjectUtils.class.getSimpleName();

  public static JSONObject readableToJson(ReadableMap map) {
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
            json.put(key, readableToJson(map.getMap(key)));
            break;
          case Array:
            json.put(key, readableToJson(map.getArray(key)));
            break;
        }
      }
    } catch (JSONException e) {
      // TODO
      EXL.d(TAG, "Error converting ReadableMap to json: " + e.toString());
    }

    return json;
  }

  public static JSONArray readableToJson(ReadableArray array) {
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
            json.put(readableToJson(array.getMap(i)));
            break;
          case Array:
            json.put(readableToJson(array.getArray(i)));
            break;
        }
      }
    } catch (JSONException e) {
      // TODO
      EXL.d(TAG, "Error converting ReadableArray to json: " + e.toString());
    }

    return json;
  }

  public static WritableMap jsonToReadable(JSONObject jsonObject) throws JSONException {
    WritableMap writableMap = Arguments.createMap();
    Iterator iterator = jsonObject.keys();
    while (iterator.hasNext()) {
      String key = (String) iterator.next();
      Object value = jsonObject.get(key);
      if (value instanceof Float || value instanceof Double) {
        writableMap.putDouble(key, jsonObject.getDouble(key));
      } else if (value instanceof Number) {
        writableMap.putDouble(key, jsonObject.getLong(key));
      } else if (value instanceof Boolean) {
        writableMap.putBoolean(key, jsonObject.getBoolean(key));
      } else if (value instanceof String) {
        writableMap.putString(key, jsonObject.getString(key));
      } else if (value instanceof JSONObject) {
        writableMap.putMap(key,jsonToReadable(jsonObject.getJSONObject(key)));
      } else if (value instanceof JSONArray){
        writableMap.putArray(key, jsonToReadable(jsonObject.getJSONArray(key)));
      } else if (value == JSONObject.NULL){
        writableMap.putNull(key);
      }
    }
    return writableMap;
  }

  public static WritableArray jsonToReadable(JSONArray jsonArray) throws JSONException {
    WritableArray writableArray = Arguments.createArray();
    for (int i = 0; i < jsonArray.length(); i++) {
      Object value = jsonArray.get(i);
      if (value instanceof Float || value instanceof Double) {
        writableArray.pushDouble(jsonArray.getDouble(i));
      } else if (value instanceof Number) {
        writableArray.pushDouble(jsonArray.getLong(i));
      } else if (value instanceof Boolean) {
        writableArray.pushBoolean(jsonArray.getBoolean(i));
      } else if (value instanceof String) {
        writableArray.pushString(jsonArray.getString(i));
      } else if (value instanceof JSONObject) {
        writableArray.pushMap(jsonToReadable(jsonArray.getJSONObject(i)));
      } else if (value instanceof JSONArray){
        writableArray.pushArray(jsonToReadable(jsonArray.getJSONArray(i)));
      } else if (value == JSONObject.NULL){
        writableArray.pushNull();
      }
    }
    return writableArray;
  }
}
