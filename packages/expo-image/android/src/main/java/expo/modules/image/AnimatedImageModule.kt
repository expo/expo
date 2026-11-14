package expo.modules.image

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.load.ImageHeaderParser.ImageType
import com.bumptech.glide.load.ImageHeaderParserUtils
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.module.LibraryGlideModule
import com.bumptech.glide.util.ByteBufferUtil
import com.github.penfeizhou.animation.decode.FrameSeqDecoder
import com.github.penfeizhou.animation.glide.ByteBufferAnimationDecoder
import com.github.penfeizhou.animation.glide.StreamAnimationDecoder
import java.io.DataInputStream
import java.io.EOFException
import java.io.InputStream
import java.nio.ByteBuffer

/**
 * Requests disable APNG4Android's own animated WebP, APNG and AVIF checks
 * (see `disableUnboundedAnimationChecks`). This module finds those images with bounded reads
 * and still decodes them with APNG4Android. Static AVIF goes to APNG4Android too, because Glide's
 * AVIF integration decodes 10-bit files as `RGBA_F16`, which needs API 26.
 * A [LibraryGlideModule] also runs when the app excludes `ExpoImageAppGlideModule`.
 * Library modules run before the app module, so Glide's GIF decoders there stay first.
 */
@GlideModule
class AnimatedImageModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    super.registerComponents(context, glide, registry)

    val parsers = registry.imageHeaderParsers
    val animationDecoder = ByteBufferAnimationDecoder()
    registry.prepend(
      InputStream::class.java,
      FrameSeqDecoder::class.java,
      BoundedAnimationDecoder(
        StreamAnimationDecoder(animationDecoder),
        getType = { ImageHeaderParserUtils.getType(parsers, it, glide.arrayPool) },
        toStream = { it }
      )
    )
    registry.prepend(
      ByteBuffer::class.java,
      FrameSeqDecoder::class.java,
      BoundedAnimationDecoder(
        animationDecoder,
        getType = { ImageHeaderParserUtils.getType(parsers, it) },
        toStream = ByteBufferUtil::toStream
      )
    )
  }
}

private class BoundedAnimationDecoder<T : Any>(
  private val decoder: ResourceDecoder<T, FrameSeqDecoder<*, *>>,
  private val getType: (T) -> ImageType,
  private val toStream: (T) -> InputStream
) : ResourceDecoder<T, FrameSeqDecoder<*, *>> {
  // Glide's header parser reads only the file header. It rewinds the source before it returns.
  override fun handles(source: T, options: Options) = when (getType(source)) {
    ImageType.ANIMATED_WEBP, ImageType.AVIF, ImageType.ANIMATED_AVIF -> true
    ImageType.PNG, ImageType.PNG_A -> isAnimatedPng(toStream(source))
    else -> false
  }

  override fun decode(source: T, width: Int, height: Int, options: Options) =
    decoder.decode(source, width, height, options)
}

private const val PNG_SIGNATURE_SIZE = 8L
private const val CHUNK_HEADER_SIZE = 8L
private const val CHUNK_CRC_SIZE = 4L
private const val ACTL_CHUNK = 0x6163544C
private const val IDAT_CHUNK = 0x49444154

// Stays far below Glide's 5 MB mark limit, so Glide can still rewind the stream.
private const val MAX_APNG_HEADER_BYTES = 1L shl 20

/**
 * APNG requires the `acTL` chunk before the first `IDAT` chunk.
 * This reads only the chunk headers before the image data, up to [MAX_APNG_HEADER_BYTES].
 */
private fun isAnimatedPng(stream: InputStream): Boolean {
  val input = DataInputStream(stream)
  try {
    input.skipBytes(PNG_SIGNATURE_SIZE.toInt())
    var position = PNG_SIGNATURE_SIZE
    while (true) {
      val length = input.readInt().toLong() and 0xFFFFFFFFL
      when (input.readInt()) {
        ACTL_CHUNK -> return true
        IDAT_CHUNK -> return false
      }
      val skip = length + CHUNK_CRC_SIZE
      position += CHUNK_HEADER_SIZE + skip
      if (position > MAX_APNG_HEADER_BYTES || input.skipBytes(skip.toInt()) < skip) {
        return false
      }
    }
  } catch (e: EOFException) {
    // A truncated PNG has no `acTL` chunk before its image data.
  }
  return false
}
