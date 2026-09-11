// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Typeface
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.common.assets.ReactFontManager
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

    AsyncFunction("loadAsync") { fontFamilyName: String, localUri: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

      // TODO(nikki): make sure path is in experience's scope
      val source = FontSource.resolve(localUri, fontFamilyName, context)

      val instanced = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        buildVariableWeightTypeface(fontFamilyName, source)
      } else {
        // This needs `android.graphics.fonts`, which API 29 added. Before API 29, every weight
        // comes from the one weight that Android loads, and Android synthesizes bold from it.
        null
      }
      val typeface = instanced ?: source.load()

      ReactFontManager.getInstance().addCustomFont(fontFamilyName, typeface)
      loadedFonts = getLoadedFonts().toMutableSet().apply { add(fontFamilyName) }.toList()
    }
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
