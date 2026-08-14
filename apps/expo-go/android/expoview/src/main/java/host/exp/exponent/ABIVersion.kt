// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

object ABIVersion {
  private const val EXPO_SDK_RUNTIME_VERSION_PREFIX = "exposdk:"

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

  // The major component of an SDK version, e.g. "56" for "56.0.0". Accepts an optional
  // "exposdk:" runtime-version prefix (so "exposdk:56.0.0" also yields "56"). Returns null
  // when there is no version or no numeric major to read.
  @JvmStatic fun majorVersion(sdkVersion: String?): String? {
    val stripped = sdkVersion?.removePrefix(EXPO_SDK_RUNTIME_VERSION_PREFIX) ?: return null
    return stripped.split(".").firstOrNull()?.takeIf { it.isNotEmpty() }
  }

  // Whether a project's [sdkVersion] is compatible with the SDK version this Expo Go client
  // supports ([supportedSdkVersion]). Two versions are compatible when they share a major
  // version; UNVERSIONED is compatible with anything.
  //
  // Expo Go ships supporting a single SDK major and projects always publish X.0.0, so the
  // major version is what determines compatibility. The client's own version string is not
  // guaranteed to equal the supported SDK version — a client patch release (e.g. 56.0.1
  // serving SDK 56.0.0) bumps the former but not the latter — so comparing the full version
  // string would reject every otherwise-loadable project. Both arguments accept an optional
  // "exposdk:" prefix so runtime versions can be passed directly.
  @JvmStatic fun isCompatibleSdkVersion(supportedSdkVersion: String?, sdkVersion: String?): Boolean {
    val supported = supportedSdkVersion?.removePrefix(EXPO_SDK_RUNTIME_VERSION_PREFIX) ?: return false
    val candidate = sdkVersion?.removePrefix(EXPO_SDK_RUNTIME_VERSION_PREFIX) ?: return false
    if (supported == RNObject.UNVERSIONED || candidate == RNObject.UNVERSIONED) {
      return true
    }
    val supportedMajor = majorVersion(supported) ?: return false
    val candidateMajor = majorVersion(candidate) ?: return false
    return supportedMajor == candidateMajor
  }
}
