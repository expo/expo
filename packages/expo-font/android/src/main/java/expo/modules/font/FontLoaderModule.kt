// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Typeface
import android.graphics.fonts.FontFamily
import android.graphics.fonts.FontStyle
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.common.assets.ReactFontManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.IOException

private const val TAG = "ExpoFontLoader"

open class FontLoaderModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    var loadedFonts: List<String>? = null

    fun getLoadedFonts(): List<String> {
      return loadedFonts ?: queryCustomNativeFonts().also { loadedFonts = it }
    }

    Name("ExpoFontLoader")

    Function("getLoadedFonts") {
      return@Function getLoadedFonts()
    }

    fun registerTypeface(fontFamilyName: String, typeface: Typeface) {
      ReactFontManager.getInstance().addCustomFont(fontFamilyName, typeface)
      loadedFonts = getLoadedFonts().toMutableSet().apply { add(fontFamilyName) }.toList()
    }

    AsyncFunction("loadAsync") { fontFamilyName: String, localUri: String ->
      registerTypeface(fontFamilyName, loadSingleFaceTypeface(fontFamilyName, localUri))
    }

    AsyncFunction("loadFontFamilyAsync") { fontFamilyName: String, faces: List<FontFaceRecord> ->
      if (faces.isEmpty()) {
        throw CodedException(
          "Could not load font family '$fontFamilyName' because 'faces' is empty. Pass at " +
            "least one face with a 'localUri' pointing to a font file."
        )
      }
      FontFamilyFaces.assertWeightsInRange(fontFamilyName, faces)

      registerTypeface(fontFamilyName, familyTypeface(fontFamilyName, faces))
    }
  }

  /**
   * A lone face with nothing declared loads exactly like `loadAsync`, which also expands a
   * variable font's `wght` axis. Below API 29, `android.graphics.fonts.FontFamily` doesn't
   * exist, so only the default face loads and Android synthesizes bold/italic from it.
   */
  private fun familyTypeface(fontFamilyName: String, faces: List<FontFaceRecord>): Typeface {
    val face = faces.first()
    if (faces.size == 1 && face.weight == null && face.style == null) {
      return loadSingleFaceTypeface(fontFamilyName, face.localUri)
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      val defaultFace = faces[FontFamilyFaces.defaultFaceIndex(faces)]
      return loadSingleFaceTypeface(fontFamilyName, defaultFace.localUri)
    }
    return buildMultiFaceTypeface(fontFamilyName, faces)
  }

  /**
   * The typeface for one font file: the file's one weight, with `fontWeight` synthesizing bold
   * from it — or, on API 29+, every weight a variable font's `wght` axis covers.
   */
  private fun loadSingleFaceTypeface(fontFamilyName: String, localUri: String): Typeface {
    // TODO(nikki): make sure path is in experience's scope
    val source = FontSource.resolve(localUri, fontFamilyName, context)

    val instanced = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      buildVariableWeightTypeface(fontFamilyName, source)
    } else {
      null
    }
    return instanced ?: source.load()
  }

  /**
   * One [Typeface] holding every face, so `Typeface.create(typeface, weight, italic)` selects
   * the right file at render time.
   */
  @RequiresApi(Build.VERSION_CODES.Q)
  private fun buildMultiFaceTypeface(fontFamilyName: String, faces: List<FontFaceRecord>): Typeface {
    val fonts = faces.map { face ->
      val builder = FontSource.resolve(face.localUri, fontFamilyName, context).newFontBuilder()
      face.weight?.let { builder.setWeight(it) }
      face.style?.let {
        builder.setSlant(
          if (it == "italic") FontStyle.FONT_SLANT_ITALIC else FontStyle.FONT_SLANT_UPRIGHT
        )
      }

      try {
        builder.build()
      } catch (e: IOException) {
        throw CodedException(
          "Could not read font face '${face.localUri}' for family '$fontFamilyName'. The file " +
            "may be corrupted or in a format Android can't parse. Open it in a font editor to " +
            "check it, or replace it with a valid .ttf or .otf file.",
          e
        )
      }
    }

    // Undeclared weight/style resolve from the file, so faces can still collide after the
    // declared-values check. Re-check the resolved values so a collision names the two files.
    val resolvedFaces = faces.zip(fonts).map { (face, font) ->
      FontFaceRecord(
        localUri = face.localUri,
        weight = font.style.weight,
        style = if (font.style.slant == FontStyle.FONT_SLANT_ITALIC) "italic" else "normal"
      )
    }
    FontFamilyFaces.assertNoDuplicateFaces(fontFamilyName, resolvedFaces)

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
   * Queries custom native font names from the assets.
   * Alignment with React Native's implementation at:
   * https://github.com/facebook/react-native/blob/363ee484b/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/common/assets/ReactFontManager.java#L146-L161
   */
  private fun queryCustomNativeFonts(): List<String> {
    val assetManager = context.assets
    val fontFileRegex = Regex("^(.+?)(_bold|_italic|_bold_italic)?\\.(ttf|otf)$")
    val customFontFamilies = ReactFontManager.getInstance().customFontFamilies

    val assetFonts = assetManager.list("fonts/")
      ?.mapNotNull { fileName ->
        fontFileRegex.find(fileName)?.groupValues?.get(1)
      }
      .orEmpty()

    return customFontFamilies.union(assetFonts).filter { it.isNotBlank() }
  }
}

/**
 * A typeface that can draw [source] at every weight that `fontWeight` can request. `null` if
 * [source] is not a variable font with a `wght` axis.
 *
 * An error here is never fatal. The caller then loads the font without changes. Only the weights
 * are lost.
 */
@RequiresApi(Build.VERSION_CODES.Q)
private fun buildVariableWeightTypeface(
  fontFamilyName: String,
  source: FontSource
): Typeface? {
  // Read the font outside the `try`. A font that the code cannot read must then fail as a read
  // error, not as a weight error.
  val fontData = source.readForInstancing() ?: return null

  return try {
    VariableTypefaces.build(fontData)
  } catch (e: IOException) {
    // The `fvar` table read correctly, but the font does not parse.
    Log.w(
      TAG,
      "Couldn't build the weights of '$fontFamilyName' from its `wght` axis, so `fontWeight` " +
        "won't apply to it — it renders at the font's default weight throughout. Load a separate " +
        "static font file for each weight you need.",
      e
    )
    null
  } catch (e: RuntimeException) {
    // VariableTypefaces sets every Font.Builder argument to a constant or a clamped value. An
    // exception here therefore shows a defect in expo-font, not a limit of the font.
    Log.e(
      TAG,
      "expo-font couldn't build the weights of '$fontFamilyName' because of an internal error, so " +
        "`fontWeight` won't apply to it. Please report this at " +
        "https://github.com/expo/expo/issues.",
      e
    )
    null
  }
}
