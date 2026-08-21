// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.kotlin.exception.CodedException
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel

private const val ASSET_SCHEME = "asset://"

private class FileNotFoundException(uri: String) :
  CodedException("File '$uri' doesn't exist")

/**
 * The location of a font to load.
 *
 * Both cases read the font header first. A static font therefore does not get a full read. The
 * cases differ in how they read that header. An asset supports only streaming. A file supports
 * mapping.
 */
internal sealed interface FontSource {
  /** The font as Android loads it: one weight. Android synthesizes bold from that weight. */
  fun load(): Typeface

  /**
   * The full font in a direct buffer. `null` if the header shows that this is not a variable font.
   *
   * A result that is not `null` does not confirm a variable font. [VariableTypefaces.build] makes
   * the final decision.
   */
  fun readForInstancing(): ByteBuffer?

  /**
   * A [Font.Builder] for this face, with no weight or slant set yet. The builder reads the file
   * itself — no [readForInstancing] buffer needed.
   */
  @RequiresApi(Build.VERSION_CODES.Q)
  fun newFontBuilder(): Font.Builder

  class Asset(private val path: String, private val context: Context) : FontSource {
    override fun load(): Typeface =
      Typeface.createFromAsset(context.assets, path)

    /** Reads the header first. A static font therefore does not go into memory. */
    override fun readForInstancing(): ByteBuffer? =
      context.assets.open(path).use { input ->
        val header = input.readAtMost(FontVariationAxes.TABLE_DIRECTORY_LIMIT)
        if (!FontVariationAxes.declaresVariations(header)) {
          return@use null
        }

        readWholeFont(header, input)
      }

    @RequiresApi(Build.VERSION_CODES.Q)
    override fun newFontBuilder(): Font.Builder = Font.Builder(context.assets, path)
  }

  class LocalFile(private val file: File) : FontSource {
    override fun load(): Typeface = Typeface.createFromFile(file)

    override fun readForInstancing(): ByteBuffer? {
      val mapped = FileInputStream(file).use { input ->
        input.channel.map(FileChannel.MapMode.READ_ONLY, 0, input.channel.size())
      }
      return mapped.takeIf { FontVariationAxes.declaresVariations(it) }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    override fun newFontBuilder(): Font.Builder = Font.Builder(file)
  }

  companion object {
    fun resolve(localUri: String, fontFamilyName: String, context: Context): FontSource {
      if (localUri.startsWith(ASSET_SCHEME)) {
        // Also remove the leading slash.
        return Asset(localUri.substring(ASSET_SCHEME.length + 1), context)
      }

      val file = Uri.parse(localUri).path?.let { File(it) }
        ?: throw FileNotFoundException(localUri)

      if (file.length() == 0L) {
        throw CodedException(
          "Font file for $fontFamilyName is empty. Make sure the local file path is correctly populated."
        )
      }

      return LocalFile(file)
    }
  }
}
