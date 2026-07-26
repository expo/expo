// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.content.res.AssetManager
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.util.Log
import com.facebook.react.common.assets.ReactFontManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel

private const val TAG = "ExpoFontLoader"

private const val ASSET_SCHEME = "asset://"

private class FileNotFoundException(uri: String) :
  CodedException("File '$uri' doesn't exist")

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
      val typeface: Typeface = if (localUri.startsWith(ASSET_SCHEME)) {
        // Also remove the leading slash.
        val assetPath = localUri.substring(ASSET_SCHEME.length + 1)

        createVariableTypeface(fontFamilyName) { readVariableFont(context.assets, assetPath) }
          ?: Typeface.createFromAsset(context.assets, assetPath)
      } else {
        val file = Uri.parse(localUri).path?.let { File(it) }
          ?: throw FileNotFoundException(localUri)

        if (file.length() == 0L) {
          throw CodedException(
            "Font file for $fontFamilyName is empty. Make sure the local file path is correctly populated."
          )
        }

        createVariableTypeface(fontFamilyName) { readVariableFont(file) }
          ?: Typeface.createFromFile(file)
      }

      ReactFontManager.getInstance().addCustomFont(fontFamilyName, typeface)
      loadedFonts = getLoadedFonts().toMutableSet().apply { add(fontFamilyName) }.toList()
    }
  }

  /**
   * Builds a typeface holding an instance of the font at every weight `fontWeight` can request.
   *
   * Returns `null` when that isn't possible — below API 29, for a static font, or when the font
   * cannot be instanced — leaving the caller to load it unchanged.
   */
  private fun createVariableTypeface(
    fontFamilyName: String,
    readFont: () -> ByteBuffer?
  ): Typeface? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return null
    }
    // Read outside the `try` so that a font that can't be read at all surfaces as itself rather
    // than as a variation failure.
    val fontData = readFont() ?: return null
    return try {
      VariableTypefaces.build(fontData)
    } catch (e: Exception) {
      Log.w(
        TAG,
        "Couldn't instance the weights of '$fontFamilyName', so `fontWeight` won't apply to it — " +
          "it renders at the font's default weight throughout. Load a separate static font file " +
          "for each weight you need if the font can't be instanced.",
        e
      )
      null
    }
  }

  /**
   * Maps [file] into a buffer [VariableTypefaces] can take. Mapping costs nothing for a static
   * font that ends up loaded through [Typeface.createFromFile] instead, so there's nothing to skip.
   */
  private fun readVariableFont(file: File): ByteBuffer =
    FileInputStream(file).use { input ->
      input.channel.map(FileChannel.MapMode.READ_ONLY, 0, input.channel.size())
    }

  /**
   * Reads the font at [path] out of the assets, or returns `null` as soon as its header shows it
   * isn't a variable font. Most fonts aren't, and an asset can't be mapped the way a file can, so
   * copying every one of them into memory only to throw the copy away is wasted work.
   * [VariableTypefaces] takes direct buffers only, hence the copy at all.
   */
  private fun readVariableFont(assets: AssetManager, path: String): ByteBuffer? {
    return assets.open(path).use { input ->
      val header = input.readAtMost(FontVariationAxes.TABLE_DIRECTORY_LIMIT)
      if (!FontVariationAxes.declaresVariations(ByteBuffer.wrap(header))) {
        return@use null
      }

      val rest = input.readBytes()
      ByteBuffer.allocateDirect(header.size + rest.size)
        .put(header)
        .put(rest)
        .apply { rewind() }
    }
  }

  /** Reads [count] bytes, returning fewer only when the stream ends first. */
  private fun InputStream.readAtMost(count: Int): ByteArray {
    val bytes = ByteArray(count)
    var total = 0
    while (total < count) {
      val read = read(bytes, total, count - total)
      if (read < 0) {
        break
      }
      total += read
    }
    return if (total == count) bytes else bytes.copyOf(total)
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
