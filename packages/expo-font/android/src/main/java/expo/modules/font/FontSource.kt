// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Typeface
import android.net.Uri
import expo.modules.kotlin.exception.CodedException
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel

private const val ASSET_SCHEME = "asset://"

private class FileNotFoundException(uri: String) :
  CodedException("File '$uri' doesn't exist")

/**
 * Where a font to load lives.
 *
 * Both cases check the font's header before reading the whole file, so a static font is never read
 * in full for nothing. They differ in how they reach that header: an asset can only be streamed, a
 * file can be mapped.
 */
internal sealed interface FontSource {
  /** The font as Android loads it: one weight, with bold synthesized from it. */
  fun load(): Typeface

  /**
   * The whole font in a direct buffer, or `null` if the header says it isn't a variable font.
   * Non-null is not a promise of a variable font — [VariableTypefaces.build] decides.
   */
  fun readForInstancing(): ByteBuffer?

  class Asset(private val path: String, private val context: Context) : FontSource {
    override fun load(): Typeface =
      Typeface.createFromAsset(context.assets, path)

    /** Reads the header first, so a static font is never copied into memory. */
    override fun readForInstancing(): ByteBuffer? =
      context.assets.open(path).use { input ->
        val header = input.readAtMost(FontVariationAxes.TABLE_DIRECTORY_LIMIT)
        if (!FontVariationAxes.declaresVariations(header)) {
          return@use null
        }

        readWholeFont(header, input)
      }
  }

  class LocalFile(private val file: File) : FontSource {
    override fun load(): Typeface = Typeface.createFromFile(file)

    override fun readForInstancing(): ByteBuffer? {
      val mapped = FileInputStream(file).use { input ->
        input.channel.map(FileChannel.MapMode.READ_ONLY, 0, input.channel.size())
      }
      return mapped.takeIf { FontVariationAxes.declaresVariations(it) }
    }
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
