package expo.modules.blur

internal fun TintStyle.toColorInt(blurRadius: Float): Int {
  val intensity = blurRadius / 100
  return when (this) {
    // Color int represented by: a >> 24 + r >> 16 + g >> 8 + b
    TintStyle.DARK -> ((255 * intensity * 0.69).toInt() shl 24) + (25 shl 16) + (25 shl 8) + 25
    // From Apple iOS 14 Sketch Kit - https://developer.apple.com/design/resources/
    TintStyle.LIGHT -> ((255 * intensity * 0.78).toInt() shl 24) + (249 shl 16) + (249 shl 8) + 249
    // From xcode composition
    else -> ((255 * intensity * 0.3).toInt() shl 24) + (255 shl 16) + (255 shl 8) + 255
  }
}
