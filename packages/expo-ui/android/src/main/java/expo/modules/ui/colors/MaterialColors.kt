package expo.modules.ui.colors

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import androidx.compose.material3.ColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import com.google.android.material.color.utilities.DynamicScheme
import com.google.android.material.color.utilities.Hct
import com.google.android.material.color.utilities.MaterialDynamicColors
import com.google.android.material.color.utilities.SchemeTonalSpot
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.ui.ExpoColorScheme

/**
 * Whether the current device supports Material You wallpaper-based dynamic
 * colors. Equivalent to Android 12 (API 31) or newer.
 */
internal val isDynamicColorSupported: Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S

internal class MaterialColorsOptions : Record {
  @Field val scheme: ExpoColorScheme? = null
  @Field val seedColor: android.graphics.Color? = null
}

internal fun Context.isSystemInDarkTheme(): Boolean {
  val nightFlag = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
  return nightFlag == Configuration.UI_MODE_NIGHT_YES
}

/**
 * Build a Material 3 `ColorScheme` from a single seed color, matching the
 * `SchemeTonalSpot` variant used by Material You. Works on every Android API
 * level (no wallpaper required).
 */
@SuppressLint("RestrictedApi")
internal fun seedColorScheme(seedArgb: Int, isDark: Boolean): ColorScheme {
  val scheme: DynamicScheme = SchemeTonalSpot(Hct.fromInt(seedArgb), isDark, 0.0)
  val m = MaterialDynamicColors()
  fun argb(dc: com.google.android.material.color.utilities.DynamicColor): Color = Color(dc.getArgb(scheme))
  return ColorScheme(
    primary = argb(m.primary()),
    onPrimary = argb(m.onPrimary()),
    primaryContainer = argb(m.primaryContainer()),
    onPrimaryContainer = argb(m.onPrimaryContainer()),
    inversePrimary = argb(m.inversePrimary()),
    secondary = argb(m.secondary()),
    onSecondary = argb(m.onSecondary()),
    secondaryContainer = argb(m.secondaryContainer()),
    onSecondaryContainer = argb(m.onSecondaryContainer()),
    tertiary = argb(m.tertiary()),
    onTertiary = argb(m.onTertiary()),
    tertiaryContainer = argb(m.tertiaryContainer()),
    onTertiaryContainer = argb(m.onTertiaryContainer()),
    background = argb(m.background()),
    onBackground = argb(m.onBackground()),
    surface = argb(m.surface()),
    onSurface = argb(m.onSurface()),
    surfaceVariant = argb(m.surfaceVariant()),
    onSurfaceVariant = argb(m.onSurfaceVariant()),
    surfaceTint = argb(m.surfaceTint()),
    inverseSurface = argb(m.inverseSurface()),
    inverseOnSurface = argb(m.inverseOnSurface()),
    error = argb(m.error()),
    onError = argb(m.onError()),
    errorContainer = argb(m.errorContainer()),
    onErrorContainer = argb(m.onErrorContainer()),
    outline = argb(m.outline()),
    outlineVariant = argb(m.outlineVariant()),
    scrim = argb(m.scrim()),
    surfaceBright = argb(m.surfaceBright()),
    surfaceDim = argb(m.surfaceDim()),
    surfaceContainer = argb(m.surfaceContainer()),
    surfaceContainerHigh = argb(m.surfaceContainerHigh()),
    surfaceContainerHighest = argb(m.surfaceContainerHighest()),
    surfaceContainerLow = argb(m.surfaceContainerLow()),
    surfaceContainerLowest = argb(m.surfaceContainerLowest()),
    primaryFixed = argb(m.primaryFixed()),
    primaryFixedDim = argb(m.primaryFixedDim()),
    onPrimaryFixed = argb(m.onPrimaryFixed()),
    onPrimaryFixedVariant = argb(m.onPrimaryFixedVariant()),
    secondaryFixed = argb(m.secondaryFixed()),
    secondaryFixedDim = argb(m.secondaryFixedDim()),
    onSecondaryFixed = argb(m.onSecondaryFixed()),
    onSecondaryFixedVariant = argb(m.onSecondaryFixedVariant()),
    tertiaryFixed = argb(m.tertiaryFixed()),
    tertiaryFixedDim = argb(m.tertiaryFixedDim()),
    onTertiaryFixed = argb(m.onTertiaryFixed()),
    onTertiaryFixedVariant = argb(m.onTertiaryFixedVariant())
  )
}

internal fun Color.toRgbaHex(): String {
  val argb = toArgb()
  // Rotate AARRGGBB → RRGGBBAA: shift RGB left by one byte, OR alpha into the low byte.
  val rgba = (argb shl 8) or ((argb ushr 24) and 0xFF)
  return "#%08X".format(rgba)
}

internal fun ColorScheme.toTokenMap(): Map<String, String> = mapOf(
  "primary" to primary.toRgbaHex(),
  "onPrimary" to onPrimary.toRgbaHex(),
  "primaryContainer" to primaryContainer.toRgbaHex(),
  "onPrimaryContainer" to onPrimaryContainer.toRgbaHex(),
  "inversePrimary" to inversePrimary.toRgbaHex(),
  "secondary" to secondary.toRgbaHex(),
  "onSecondary" to onSecondary.toRgbaHex(),
  "secondaryContainer" to secondaryContainer.toRgbaHex(),
  "onSecondaryContainer" to onSecondaryContainer.toRgbaHex(),
  "tertiary" to tertiary.toRgbaHex(),
  "onTertiary" to onTertiary.toRgbaHex(),
  "tertiaryContainer" to tertiaryContainer.toRgbaHex(),
  "onTertiaryContainer" to onTertiaryContainer.toRgbaHex(),
  "background" to background.toRgbaHex(),
  "onBackground" to onBackground.toRgbaHex(),
  "surface" to surface.toRgbaHex(),
  "onSurface" to onSurface.toRgbaHex(),
  "surfaceVariant" to surfaceVariant.toRgbaHex(),
  "onSurfaceVariant" to onSurfaceVariant.toRgbaHex(),
  "surfaceTint" to surfaceTint.toRgbaHex(),
  "inverseSurface" to inverseSurface.toRgbaHex(),
  "inverseOnSurface" to inverseOnSurface.toRgbaHex(),
  "error" to error.toRgbaHex(),
  "onError" to onError.toRgbaHex(),
  "errorContainer" to errorContainer.toRgbaHex(),
  "onErrorContainer" to onErrorContainer.toRgbaHex(),
  "outline" to outline.toRgbaHex(),
  "outlineVariant" to outlineVariant.toRgbaHex(),
  "scrim" to scrim.toRgbaHex(),
  "surfaceBright" to surfaceBright.toRgbaHex(),
  "surfaceDim" to surfaceDim.toRgbaHex(),
  "surfaceContainer" to surfaceContainer.toRgbaHex(),
  "surfaceContainerHigh" to surfaceContainerHigh.toRgbaHex(),
  "surfaceContainerHighest" to surfaceContainerHighest.toRgbaHex(),
  "surfaceContainerLow" to surfaceContainerLow.toRgbaHex(),
  "surfaceContainerLowest" to surfaceContainerLowest.toRgbaHex(),
  "primaryFixed" to primaryFixed.toRgbaHex(),
  "primaryFixedDim" to primaryFixedDim.toRgbaHex(),
  "onPrimaryFixed" to onPrimaryFixed.toRgbaHex(),
  "onPrimaryFixedVariant" to onPrimaryFixedVariant.toRgbaHex(),
  "secondaryFixed" to secondaryFixed.toRgbaHex(),
  "secondaryFixedDim" to secondaryFixedDim.toRgbaHex(),
  "onSecondaryFixed" to onSecondaryFixed.toRgbaHex(),
  "onSecondaryFixedVariant" to onSecondaryFixedVariant.toRgbaHex(),
  "tertiaryFixed" to tertiaryFixed.toRgbaHex(),
  "tertiaryFixedDim" to tertiaryFixedDim.toRgbaHex(),
  "onTertiaryFixed" to onTertiaryFixed.toRgbaHex(),
  "onTertiaryFixedVariant" to onTertiaryFixedVariant.toRgbaHex()
)
