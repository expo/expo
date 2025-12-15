// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Typeface
import android.net.Uri
import com.facebook.react.common.assets.ReactFontManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

private const val ASSET_SCHEME = "asset://"

private class FileNotFoundException(uri: String) :
  CodedException("File '$uri' doesn't exist")

open class FontLoaderModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    // could be a Set, but to be able to pass to JS we keep it as an array
    var loadedFonts: List<String> = queryCustomNativeFonts()

    Name("ExpoFontLoader")

    Function("getLoadedFonts") {
      return@Function loadedFonts
    }

    AsyncFunction("loadAsync") { fontFamilyName: String, localUri: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

      // TODO(nikki): make sure path is in experience's scope
      val typeface: Typeface = if (localUri.startsWith(ASSET_SCHEME)) {
        Typeface.createFromAsset(
          context.assets, // Also remove the leading slash.
          localUri.substring(ASSET_SCHEME.length + 1)
        )
      } else {
        val file = Uri.parse(localUri).path?.let { File(it) }
          ?: throw FileNotFoundException(localUri)

        if (file.length() == 0L) {
          throw CodedException(
            "Font file for $fontFamilyName is empty. Make sure the local file path is correctly populated."
          )
        }

        Typeface.createFromFile(file)
      }

      ReactFontManager.getInstance().setTypeface(fontFamilyName, Typeface.NORMAL, typeface)
      loadedFonts = loadedFonts.toMutableSet().apply { add(fontFamilyName) }.toList()
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

    return assetManager.list("fonts/")
      ?.mapNotNull { fileName ->
        fontFileRegex.find(fileName)?.groupValues?.get(1)
      }
      ?.filter { it.isNotBlank() }
      .orEmpty()
  }
}
