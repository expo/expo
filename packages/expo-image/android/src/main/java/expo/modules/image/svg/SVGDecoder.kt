package expo.modules.image.svg

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource
import com.caverock.androidsvg.SVG
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
   * Parses the document, first substituting any CSS custom properties the request asked for.
   * The substitution happens on the source text because AndroidSVG cannot resolve `var()` itself.
   */
  private fun parse(source: InputStream, options: Options): SVG {
    val variables = options.get(CustomOptions.svgVariables)
    if (variables.isNullOrEmpty()) {
      return SVG.getFromInputStream(source)
    }

    val bytes = source.readBytes()
    val text = decodeUtf8(bytes)
      // Substituting would mean re-encoding the document as UTF-8, which would contradict its own
      // XML declaration. Leave it alone rather than corrupt it.
      ?: return SVG.getFromInputStream(ByteArrayInputStream(bytes))

    return SVG.getFromString(SVGVariables.substitute(text, variables))
  }

  private fun decodeUtf8(bytes: ByteArray): String? = try {
    Charsets.UTF_8.newDecoder()
      .onMalformedInput(CodingErrorAction.REPORT)
      .onUnmappableCharacter(CodingErrorAction.REPORT)
      .decode(ByteBuffer.wrap(bytes))
      .toString()
  } catch (_: CharacterCodingException) {
    null
  }
}
