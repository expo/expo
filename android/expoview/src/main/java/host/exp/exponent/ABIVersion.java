// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

public class ABIVersion {
  // Returns 5.06.07 for "5.6.7" or "5_6_7".
  // Assumes all version numbers are < 100
  public static float toNumber(final String abiVersion) {
    if (abiVersion.equals(RNObject.UNVERSIONED)) {
      return 1000;
    }

    String delimiter = "\\."; // This is a regex
    if (abiVersion.contains("_")) {
      delimiter = "_";
    }

    float value = 0;
    float scale = 1.0f;
    String[] split = abiVersion.split(delimiter);
    for (int i = 0; i < split.length; i++) {
      value += Float.parseFloat(split[i]) * scale;
      scale /= 100.0;
    }

    return value;
  }
}
