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
}
