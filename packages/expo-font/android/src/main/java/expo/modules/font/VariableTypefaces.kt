// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.os.Build
import androidx.annotation.RequiresApi
import java.nio.ByteBuffer

/**
 * Builds a typeface holding an instance of a variable font at every weight `fontWeight` can request.
 *
 * Android hands back only a variable font's default instance and won't expand its named instances,
 * so the family has to be assembled by hand. [com.facebook.react.common.assets.ReactFontManager]
 * then resolves `fontWeight` against it with `Typeface.create(typeface, weight, italic)`.
 */
@RequiresApi(Build.VERSION_CODES.Q)
internal object VariableTypefaces {
  /**
   * Returns a typeface covering every weight of the variable font in [fontData], or `null` if
   * [fontData] isn't a variable font with a `wght` axis. [fontData] has to be a direct buffer, the
   * only kind [Font.Builder] takes.
   */
  fun build(fontData: ByteBuffer): Typeface? {
    val family = buildFamily(fontData) ?: return null

    // Matches the fallback `Typeface.createFromAsset` and `createFromFile` set up, so glyphs the
    // font doesn't cover keep coming from the system font.
    return Typeface.CustomFallbackBuilder(family)
      .setSystemFallback("sans-serif")
      .build()
  }

  private fun buildFamily(fontData: ByteBuffer): FontFamily? {
    val weightAxis = FontVariationAxes.readWeightAxis(fontData) ?: return null

    // Android 15 assembles the family itself, covering every weight rather than the nine steps
    // below and applying the `ital` axis when the font declares one.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      FontFamily.Builder(Font.Builder(fontData).build())
        .buildVariableFamily()
        ?.let { return it }
    }

    val fonts = FontVariationAxes.weightsFor(weightAxis).map { weight ->
      // The variation setting picks the glyphs to draw, while the weight is what the closest-match
      // lookup reads when resolving a requested `fontWeight`.
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
