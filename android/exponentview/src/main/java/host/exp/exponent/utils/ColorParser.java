// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.graphics.Color;

public class ColorParser {

  public static boolean isValid(String color) {
    try {
      Color.parseColor(color);
      return true;
    } catch (Exception e) {
      return false;
    }
  }
}
