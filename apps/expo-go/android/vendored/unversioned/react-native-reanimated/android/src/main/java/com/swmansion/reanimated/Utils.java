package com.swmansion.reanimated;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import java.util.HashMap;
import java.util.Map;

public class Utils {

  public static boolean isChromeDebugger = false;

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

  public static String simplifyStringNumbersList(String list) {
    // transforms string: '[1, 2, 3]' -> '1 2 3'
    // to make usage of std::istringstream in C++ easier
    return list.replace(",", "").replace("[", "").replace("]", "");
  }

  public static float convertToFloat(Object value) {
    if (value instanceof Integer) {
      return ((Integer) value).floatValue();
    } else if (value instanceof Float) {
      return (float) value;
    } else if (value instanceof Double) {
      return ((Double) value).floatValue();
    }
    return 0;
  }
}
