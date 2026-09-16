package expo.modules.image.svg

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource
import com.caverock.androidsvg.SVG
import android.util.Log
import com.caverock.androidsvg.SVGParseException
import expo.modules.image.CustomOptions
import java.io.ByteArrayInputStream
import java.io.IOException
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.CodingErrorAction

/**
 * Decodes an SVG internal representation from an [InputStream].
 *
 * Copied from https://github.com/bumptech/glide/blob/10acc31a16b4c1b5684f69e8de3117371dfa77a8/samples/svg/src/main/java/com/bumptech/glide/samples/svg/SvgDecoder.java
 * and rewritten to Kotlin.
 */
class SVGDecoder : ResourceDecoder<InputStream, SVG> {
  // TODO: Can we tell?
  override fun handles(source: InputStream, options: Options) = true

  @Throws(IOException::class)
  override fun decode(source: InputStream, width: Int, height: Int, options: Options): Resource<SVG>? {
    return try {
      val svg: SVG = parse(source, options)
      // Use document width and height if view box is not set.
      if (svg.documentViewBox == null) {
        val documentWidth = svg.documentWidth
        val documentHeight = svg.documentHeight
        if (documentWidth != -1f && documentHeight != -1f) {
          svg.setDocumentViewBox(0f, 0f, documentWidth, documentHeight)
        }
      }

      // Render at maxWidth/maxHeight if provided (preserving aspect ratio), otherwise at the viewBox's natural size.
      val viewBox = svg.documentViewBox
      if (viewBox != null && viewBox.width() > 0 && viewBox.height() > 0) {
        val scaleW = if (width > 0) width.toFloat() / viewBox.width() else Float.POSITIVE_INFINITY
        val scaleH = if (height > 0) height.toFloat() / viewBox.height() else Float.POSITIVE_INFINITY
        val scale = if (scaleW.isFinite() || scaleH.isFinite()) minOf(scaleW, scaleH) else 1f
        if (scale.isFinite() && scale > 0) {
          svg.documentWidth = viewBox.width() * scale
          svg.documentHeight = viewBox.height() * scale
        }
      } else if (width > 0 && height > 0) {
        // No viewBox available to derive an aspect ratio from, fall back to the requested bounds.
        svg.documentWidth = width.toFloat()
        svg.documentHeight = height.toFloat()
      }

      SimpleResource(svg)
    } catch (ex: SVGParseException) {
      throw IOException("Cannot load SVG from stream", ex)
    }
  }

  /**
   * Parses the document, first substituting the CSS custom properties the request asked for, or
   * resolving every `var()` to its fallback when it asked for none. The substitution happens on the
   * source text because AndroidSVG cannot resolve `var()` itself.
   */
  private fun parse(source: InputStream, options: Options): SVG {
    val variables = options.get(CustomOptions.svgVariables)
    val bytes = source.readBytes()
    val text = decodeUtf8(bytes)
      // Substituting would mean re-encoding the document as UTF-8, which would contradict its own
      // XML declaration. Leave it to the parser, which sniffs the encoding itself.
      ?: return SVG.getFromInputStream(ByteArrayInputStream(bytes)).also {
        if (variables != null) {
          Log.w(
            "ExpoImage",
            "`svgVariables` was ignored because the SVG document is not encoded in UTF-8. " +
              "Re-encoding it would contradict the document's own XML declaration. " +
              "Save the file as UTF-8 to use this prop."
          )
        }
      }

    val substituted = if (variables == null) {
      SVGVariables.resolveFallbacks(text)
    } else {
      SVGVariables.substitute(text, variables)
    }
    return SVG.getFromString(substituted)
  }

  /**
   * Decodes the document as UTF-8, or returns null when it is encoded differently.
   *
   * UTF-16 needs its own check: every byte of it is valid UTF-8, so a strict decode would succeed
   * and yield NUL-interleaved text.
   */
  private fun decodeUtf8(bytes: ByteArray): String? = if (isUtf16(bytes)) {
    null
  } else {
    decodeStrictUtf8(bytes)
  }

  /**
   * Whether the document is UTF-16, by its byte order mark or by the interleaved NUL bytes. Every
   * SVG opens with ASCII, so a NUL that early means UTF-16.
   */
  private fun isUtf16(bytes: ByteArray): Boolean {
    if (bytes.size < 2) {
      return false
    }
    val hasBom = (bytes[0] == 0xFE.toByte() && bytes[1] == 0xFF.toByte()) ||
      (bytes[0] == 0xFF.toByte() && bytes[1] == 0xFE.toByte())
    return hasBom || bytes.take(NUL_SNIFF_LENGTH).any { it == 0.toByte() }
  }

  private fun decodeStrictUtf8(bytes: ByteArray): String? = try {
    Charsets.UTF_8.newDecoder()
      .onMalformedInput(CodingErrorAction.REPORT)
      .onUnmappableCharacter(CodingErrorAction.REPORT)
      .decode(ByteBuffer.wrap(bytes))
      .toString()
  } catch (_: CharacterCodingException) {
    null
  }

  companion object {
    /** How far to look for the NUL bytes that mark UTF-16, in bytes. */
    private const val NUL_SNIFF_LENGTH = 16
  }
}
