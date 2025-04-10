package expo.modules.plugin

data class Version(
  val major: Int,
  val minor: Int,
  val patch: Int
) {
  fun isAtLeast(other: Version): Boolean {
    return major > other.major ||
      (major == other.major && minor > other.minor) ||
      (major == other.major && minor == other.minor && patch >= other.patch)
  }

  fun isAtLeast(major: Int, minor: Int, patch: Int): Boolean {
    return isAtLeast(Version(major, minor, patch))
  }

  fun toNumber(): Int {
    return major * 10000 + minor * 100 + patch
  }

  companion object {
    fun fromString(value: String): Version {
      // strip pre-release
      val normalizedValue = value.substringBefore('-')
      val (major, minor, patch) = normalizedValue.split(".").map { it.toInt() }
      return Version(major, minor, patch)
    }
  }
}
