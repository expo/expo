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
 * A variable font holds every weight in one file, but Android loads it as one weight: the font's
 * default. React Native then asks for a weight with `Typeface.create(typeface, weight, italic)`,
 * which can only pick from the weights the typeface already has.
 *
 * So the weights have to be put there first. Two ways to do it:
 *  - [buildVariableFamily] — Android builds the family. Android 15 and up.
 *  - [buildInstancedFamily] — we build it, one weight at a time.
 */
@RequiresApi(Build.VERSION_CODES.Q)
internal object VariableTypefaces {
  // What `createFromAsset` and `createFromFile` use, so missing glyphs still come from the system
  // font.
  private const val SYSTEM_FALLBACK = "sans-serif"

  /**
   * A typeface with every weight of the variable font in [fontData], or `null` if [fontData] has no
   * `wght` axis. [fontData] has to be a direct buffer.
   */
  fun build(fontData: ByteBuffer): Typeface? {
    // The two don't apply the same test, so only `null` from both means there are no weights.
    val family = buildVariableFamily(fontData)
      ?: buildInstancedFamily(fontData)
      ?: return null

    return Typeface.CustomFallbackBuilder(family)
      .setSystemFallback(SYSTEM_FALLBACK)
      .build()
  }

  /**
   * The family Android builds itself. It covers the axis continuously instead of at nine fixed
   * steps, and applies `ital` if the font has one.
   *
   * `null` below Android 15, or if Android doesn't take [fontData] for a variable font.
   */
  private fun buildVariableFamily(fontData: ByteBuffer): FontFamily? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      return null
    }
    val defaultInstance = Font.Builder(fontData).build()
    return FontFamily.Builder(defaultInstance).buildVariableFamily()
  }

  /**
   * The family built by hand: one copy of the font per weight `fontWeight` can name. `null` if
   * [fontData] has no `wght` axis.
   *
   * Only for Android 14 and below. [buildVariableFamily] replaces it, and this and the `fvar`
   * reading it needs can be deleted once Android 15 is min supported sdk.
   */
  @VisibleForTesting
  internal fun buildInstancedFamily(fontData: ByteBuffer): FontFamily? {
    val weightAxis = FontVariationAxes.readWeightAxis(fontData) ?: return null

    val fonts = FontVariationAxes.weightsFor(weightAxis).map { weight ->
      // The variation setting picks the glyphs; the weight is what the closest-match lookup reads.
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
