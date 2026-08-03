// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.annotation.VisibleForTesting
import java.nio.ByteBuffer

/**
 * A variable font holds every weight in one file. Android loads only one of them: the default
 * weight. React Native then requests a weight with `Typeface.create(typeface, weight, italic)`.
 * That function selects from the weights that the typeface contains.
 *
 * This object therefore builds a typeface that contains the weights. There are two methods:
 *  - [buildVariableFamily] lets Android build the family. Android 15 and later only.
 *  - [buildInstancedFamily] builds one font for each weight.
 */
@RequiresApi(Build.VERSION_CODES.Q)
internal object VariableTypefaces {
  // `createFromAsset` and `createFromFile` use this fallback. Glyphs that the font does not
  // include therefore still come from the system font.
  private const val SYSTEM_FALLBACK = "sans-serif"

  /**
   * A typeface with every weight of the variable font in [fontData]. `null` if [fontData] has no
   * `wght` axis. [fontData] must be a direct buffer.
   */
  fun build(fontData: ByteBuffer): Typeface? {
    // The two methods apply different tests. Only `null` from both methods shows that the font
    // has no weights.
    val family = buildVariableFamily(fontData)
      ?: buildInstancedFamily(fontData)
      ?: return null

    return Typeface.CustomFallbackBuilder(family)
      .setSystemFallback(SYSTEM_FALLBACK)
      .build()
  }

  /**
   * The family that Android builds. It covers the axis continuously, not at nine fixed steps. It
   * also applies `ital` if the font declares that axis.
   *
   * `null` before Android 15. Also `null` if Android does not recognize [fontData] as a variable
   * font.
   */
  private fun buildVariableFamily(fontData: ByteBuffer): FontFamily? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      return null
    }
    val defaultInstance = Font.Builder(fontData).build()
    return FontFamily.Builder(defaultInstance).buildVariableFamily()
  }

  /**
   * The family that this object builds: one font for each weight that `fontWeight` can name.
   * `null` if [fontData] has no `wght` axis.
   *
   * Use this method only for Android 14 and earlier. [buildVariableFamily] replaces it. You can
   * delete this method, and the `fvar` reader that it uses, when Android 15 becomes the minimum
   * SDK.
   */
  @VisibleForTesting
  internal fun buildInstancedFamily(fontData: ByteBuffer): FontFamily? {
    val weightAxis = FontVariationAxes.readWeightAxis(fontData) ?: return null

    val fonts = FontVariationAxes.weightsFor(weightAxis).map { weight ->
      // The variation setting selects the glyphs. The closest-match lookup reads the weight.
      Font.Builder(fontData)
        .setFontVariationSettings("'wght' $weight")
        .setWeight(weight)
        .build()
    }

    val family = FontFamily.Builder(fonts.first())
    for (font in fonts.drop(1)) {
      family.addFont(font)
    }
    return family.build()
  }
}
