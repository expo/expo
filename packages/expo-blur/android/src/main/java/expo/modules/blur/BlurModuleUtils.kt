package expo.modules.blur

internal fun String.toColorInt(blurRadius: Float): Int {
  val intensity = blurRadius / 100
  return when (this) {
    // Color int represented by: a >> 24 + r >> 16 + g >> 8 + b
    "dark" -> ((255 * intensity * 0.69).toInt() shl 24) + (25 shl 16) + (25 shl 8) + 25
    // From Apple iOS 14 Sketch Kit - https://developer.apple.com/design/resources/
    "light" -> ((255 * intensity * 0.78).toInt() shl 24) + (249 shl 16) + (249 shl 8) + 249
    // From xcode composition
    "default" -> ((255 * intensity * 0.3).toInt() shl 24) + (255 shl 16) + (255 shl 8) + 255
    else -> throw InvalidTintValueException(this)
  }
}
