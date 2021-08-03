// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

object ABIVersion {
  // Returns (5 * 100 * 100 + 6 * 100 + 7) for "5.6.7" or "5_6_7".
  // Assumes all version numbers are < 100
  @JvmStatic fun toNumber(abiVersion: String): Int {
    if (abiVersion == RNObject.UNVERSIONED) {
      return Int.MAX_VALUE
    }
    var delimiter = "."
    if (abiVersion.contains("_")) {
      delimiter = "_"
    }
    var value = 0
    val base = 100
    var currentBasePower = 1
    val split = abiVersion.split(delimiter)
    for (str in split.reversed()) {
      value += str.toInt() * currentBasePower
      currentBasePower *= base
    }
    return value
  }
}
