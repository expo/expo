package com.swmansion.reanimated;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import java.util.HashMap;
import java.util.Map;

public class Utils {

  protected static boolean isChromeDebugger = false;

  public static Map<String, Integer> processMapping(ReadableMap style) {
    ReadableMapKeySetIterator iter = style.keySetIterator();
    HashMap<String, Integer> mapping = new HashMap<>();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      int nodeIndex = style.getInt(propKey);
      mapping.put(propKey, nodeIndex);
    }
    return mapping;
  }

  public static int[] processIntArray(ReadableArray ary) {
    int size = ary.size();
    int[] res = new int[size];
    for (int i = 0; i < size; i++) {
      res[i] = ary.getInt(i);
    }
    return res;
  }
}
