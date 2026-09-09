// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.graphics.fonts.FontStyle
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.kotlin.exception.CodedException
import java.io.IOException
import java.nio.ByteBuffer
import kotlin.math.abs

/**
 * Builds one [Typeface] from the faces of a font family. `fontWeight` and `fontStyle` then select
 * between them.
 *
 * A face that is a variable font keeps its `wght` axis: a declared weight pins the face to that
 * weight's instance, and a face with no declared weight contributes one instance per weight that
 * `fontWeight` can request. Without the instances, every weight would render the file's default.
 */
@RequiresApi(Build.VERSION_CODES.Q)
internal object MultiFaceTypeface {
  /** [faces] and [sources] pair up by index. */
  fun build(
    fontFamilyName: String,
    faces: List<FontFaceRecord>,
    sources: List<FontSource>
  ): Typeface {
    val builtFaces = faces.zip(sources).map { (face, source) ->
      try {
        buildFace(face, source)
      } catch (e: IOException) {
        throw CodedException(
          "Could not read font face '${face.localUri}' for family '$fontFamilyName'. The file " +
            "may be corrupted or in a format Android can't parse. Open it in a font editor to " +
            "check it, or replace it with a valid .ttf or .otf file.",
          e
        )
      }
    }

    // The duplicate check runs on each face's primary font. The extra instances of a variable
    // face are not declared by the caller, so a collision there is resolved below, not an error.
    val resolvedFaces = faces.zip(builtFaces).map { (face, built) ->
      FontFaceRecord(
        localUri = face.localUri,
        weight = built.primary.style.weight,
        style = if (built.primary.style.slant == FontStyle.FONT_SLANT_ITALIC) "italic" else "normal"
      )
    }
    FontFamilyFaces.assertNoDuplicateFaces(fontFamilyName, resolvedFaces)

    // Primaries first: a weight and slant a face declares wins over another face's instance of it.
    val seenStyles = mutableSetOf<Pair<Int, Int>>()
    val fonts = mutableListOf<Font>()
    for (built in builtFaces) {
      seenStyles.add(built.primary.styleKey)
      fonts.add(built.primary)
    }
    for (built in builtFaces) {
      for (instance in built.instances) {
        if (seenStyles.add(instance.styleKey)) {
          fonts.add(instance)
        }
      }
    }

    val familyBuilder = FontFamily.Builder(fonts[0])
    for (font in fonts.drop(1)) {
      try {
        familyBuilder.addFont(font)
      } catch (e: IllegalArgumentException) {
        throw CodedException(
          "expo-font couldn't build the font family '$fontFamilyName' because of an internal " +
            "error. Please report this at https://github.com/expo/expo/issues.",
          e
        )
      }
    }

    return VariableTypefaces.wrapWithSystemFallback(familyBuilder.build())
  }

  /**
   * The fonts one face contributes to the family. [primary] carries the face's declared (or the
   * file's own) weight and slant; [instances] cover the rest of a variable face's `wght` axis.
   */
  private class BuiltFace(val primary: Font, val instances: List<Font> = emptyList())

  private val Font.styleKey: Pair<Int, Int>
    get() = style.weight to style.slant

  private fun buildFace(face: FontFaceRecord, source: FontSource): BuiltFace {
    val fontData = source.readForInstancing()
    val axis = fontData?.let { FontVariationAxes.readWeightAxis(it) }
    if (axis == null) {
      val builder = source.newFontBuilder()
      face.weight?.let { builder.setWeight(it) }
      face.style?.let { builder.setSlant(slantFor(it)) }
      return BuiltFace(builder.build())
    }

    if (face.weight != null) {
      // A declared weight pins the face to that instance; the clamp keeps the axis ends.
      return BuiltFace(instance(fontData, face.weight.coerceIn(axis), face.weight, face.style))
    }

    // `FontFamily.Builder.buildVariableFamily` can't replace the fixed instances here: it exists
    // only on Android 15 and later, and accepts nothing but one upright font plus at most one
    // italic one. The instance nearest the regular weight stands in as the face's primary, which
    // is also the weight the face resolves to today when the whole file is loaded as one font.
    val instances = FontVariationAxes.weightsFor(axis).map { instance(fontData, it, it, face.style) }
    val primary = instances.minByOrNull { abs(it.style.weight - FontStyle.FONT_WEIGHT_NORMAL) }!!
    return BuiltFace(primary, instances)
  }

  private fun instance(fontData: ByteBuffer, axisWeight: Int, weight: Int, style: String?): Font {
    val builder = Font.Builder(fontData)
      .setFontVariationSettings("'wght' $axisWeight")
      .setWeight(weight)
    style?.let { builder.setSlant(slantFor(it)) }
    return builder.build()
  }

  private fun slantFor(style: String) =
    if (style == "italic") FontStyle.FONT_SLANT_ITALIC else FontStyle.FONT_SLANT_UPRIGHT
}
