package expo.modules.blur.enums

import expo.modules.kotlin.types.Enumerable

enum class TintStyle(val value: String) : Enumerable {
  DEFAULT("default"),
  EXTRA_LIGHT("extraLight"),
  LIGHT("light"),
  DARK("dark"),
  REGULAR("regular"),
  PROMINENT("prominent"),
  SYSTEM_ULTRA_THIN_MATERIAL("systemUltraThinMaterial"),
  SYSTEM_THIN_MATERIAL("systemThinMaterial"),
  SYSTEM_MATERIAL("systemMaterial"),
  SYSTEM_THICK_MATERIAL("systemThickMaterial"),
  SYSTEM_CHROME_MATERIAL("systemChromeMaterial"),
  SYSTEM_ULTRA_THIN_MATERIAL_LIGHT("systemUltraThinMaterialLight"),
  SYSTEM_THICK_MATERIAL_LIGHT("systemThickMaterialLight"),
  SYSTEM_THIN_MATERIAL_LIGHT("systemThinMaterialLight"),
  SYSTEM_MATERIAL_LIGHT("systemMaterialLight"),
  SYSTEM_CHROME_MATERIAL_LIGHT("systemChromeMaterialLight"),
  SYSTEM_ULTRA_THIN_MATERIAL_DARK("systemUltraThinMaterialDark"),
  SYSTEM_THIN_MATERIAL_DARK("systemThinMaterialDark"),
  SYSTEM_MATERIAL_DARK("systemMaterialDark"),
  SYSTEM_THICK_MATERIAL_DARK("systemThickMaterialDark"),
  SYSTEM_CHROME_MATERIAL_DARK("systemChromeMaterialDark");

  fun toBlurEffect(blurRadius: Float): Int {
    return when (this) {
      EXTRA_LIGHT,
      LIGHT,
      SYSTEM_MATERIAL_LIGHT,
      SYSTEM_ULTRA_THIN_MATERIAL_LIGHT,
      SYSTEM_THICK_MATERIAL_LIGHT -> LIGHT.toColorInt(blurRadius)

      PROMINENT,
      DEFAULT,
      SYSTEM_MATERIAL
      -> DEFAULT.toColorInt(blurRadius)

      DARK,
      SYSTEM_MATERIAL_DARK -> DARK.toColorInt(blurRadius)

      REGULAR,
      SYSTEM_ULTRA_THIN_MATERIAL,
      SYSTEM_THICK_MATERIAL,
      SYSTEM_CHROME_MATERIAL,
      SYSTEM_CHROME_MATERIAL_LIGHT,
      SYSTEM_THICK_MATERIAL_DARK,
      SYSTEM_THIN_MATERIAL_LIGHT,
      SYSTEM_THIN_MATERIAL_DARK,
      SYSTEM_ULTRA_THIN_MATERIAL_DARK,
      SYSTEM_CHROME_MATERIAL_DARK,
      SYSTEM_THIN_MATERIAL -> this.toColorInt(blurRadius)
    }
  }

  private fun toColorInt(blurRadius: Float): Int {
    val intensity = blurRadius / 100
    return when (this) {
      // Color int represented by: a >> 24 + r >> 16 + g >> 8 + b
      DARK -> ((255 * intensity * 0.69).toInt() shl 24) + (25 shl 16) + (25 shl 8) + 25
      // From Apple iOS 14 Sketch Kit - https://developer.apple.com/design/resources/
      LIGHT -> ((255 * intensity * 0.78).toInt() shl 24) + (249 shl 16) + (249 shl 8) + 249
      REGULAR -> ((255 * intensity * 0.82).toInt() shl 24) + (179 shl 16) + (179 shl 8) + 179
      SYSTEM_THIN_MATERIAL_LIGHT -> ((255 * intensity * 0.78).toInt() shl 24) + (199 shl 16) + (199 shl 8) + 199
      SYSTEM_THIN_MATERIAL -> ((255 * intensity * 0.97).toInt() shl 24) + (199 shl 16) + (199 shl 8) + 199
      SYSTEM_CHROME_MATERIAL -> ((255 * intensity * 0.75).toInt() shl 24) + (255 shl 16) + (255 shl 8) + 255
      SYSTEM_CHROME_MATERIAL_LIGHT -> ((255 * intensity * 0.97).toInt() shl 24) + (255 shl 16) + (255 shl 8) + 255
      SYSTEM_ULTRA_THIN_MATERIAL -> ((255 * intensity * 0.44).toInt() shl 24) + (191 shl 16) + (191 shl 8) + 191
      SYSTEM_THICK_MATERIAL -> ((255 * intensity * 0.97).toInt() shl 24) + (153 shl 16) + (153 shl 8) + 153
      SYSTEM_THICK_MATERIAL_DARK -> ((255 * intensity * 0.9).toInt() shl 24) + (37 shl 16) + (37 shl 8) + 37
      SYSTEM_THIN_MATERIAL_DARK -> ((255 * intensity * 0.7).toInt() shl 24) + (37 shl 16) + (37 shl 8) + 37
      SYSTEM_ULTRA_THIN_MATERIAL_DARK -> ((255 * intensity * 0.55).toInt() shl 24) + (37 shl 16) + (37 shl 8) + 37
      SYSTEM_CHROME_MATERIAL_DARK -> ((255 * intensity * 0.75).toInt() shl 24) + (0 shl 16) + (0 shl 8) + 0
      else -> ((255 * intensity * 0.44).toInt() shl 24) + (255 shl 16) + (255 shl 8) + 255
    }
  }
}
