// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

public class ABIVersion {
  // Returns (5 * 100 * 100 + 6 * 100 + 7) for "5.6.7" or "5_6_7".
  // Assumes all version numbers are < 100
  public static int toNumber(final String abiVersion) {
    if (abiVersion.equals(RNObject.UNVERSIONED)) {
      return Integer.MAX_VALUE;
    }

    String delimiter = "\\."; // This is a regex
    if (abiVersion.contains("_")) {
      delimiter = "_";
    }

    int value = 0;
    int base = 100;
    int currentBasePower = 1;
    String[] split = abiVersion.split(delimiter);
    for (int i = split.length - 1; i >= 0; --i) {
      value += Integer.parseInt(split[i]) * currentBasePower;
      currentBasePower *= base;
    }

    return value;
  }
}
