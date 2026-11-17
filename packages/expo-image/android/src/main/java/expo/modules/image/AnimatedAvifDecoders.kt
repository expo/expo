package expo.modules.image

import com.bumptech.glide.load.ImageHeaderParser
import com.bumptech.glide.load.ImageHeaderParserUtils
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.engine.bitmap_recycle.ArrayPool
import com.github.penfeizhou.animation.decode.FrameSeqDecoder
import java.io.IOException
import java.io.InputStream
import java.nio.ByteBuffer

/*
 * APNG4Android's decoders claim every AVIF, still images included, ahead of Glide's
 * avif-integration. A still AVIF then becomes a one-frame animation: its size is read by blocking
 * the main thread on APNG4Android's worker threads, the memory cache keeps the decoder instead of
 * the pixels, and Glide transformations such as `blurRadius` don't apply.
 *
 * [ExpoImageAppGlideModule] turns off APNG4Android's AVIF support and registers these decoders
 * instead, so only animated AVIFs (an `avis` brand in the `ftyp` box) go through APNG4Android and
 * still ones are decoded into bitmaps by Glide.
 */

internal class AnimatedAvifByteBufferDecoder(
  private val parsers: List<ImageHeaderParser>,
  private val decoder: ResourceDecoder<ByteBuffer, FrameSeqDecoder<*, *>>
) : ResourceDecoder<ByteBuffer, FrameSeqDecoder<*, *>> {
  @Throws(IOException::class)
  override fun handles(source: ByteBuffer, options: Options): Boolean =
    ImageHeaderParserUtils.getType(parsers, source) == ImageHeaderParser.ImageType.ANIMATED_AVIF

  @Throws(IOException::class)
  override fun decode(source: ByteBuffer, width: Int, height: Int, options: Options): Resource<FrameSeqDecoder<*, *>>? =
    decoder.decode(source, width, height, options)
}

internal class AnimatedAvifStreamDecoder(
  private val parsers: List<ImageHeaderParser>,
  private val arrayPool: ArrayPool,
  private val decoder: ResourceDecoder<InputStream, FrameSeqDecoder<*, *>>
) : ResourceDecoder<InputStream, FrameSeqDecoder<*, *>> {
  @Throws(IOException::class)
  override fun handles(source: InputStream, options: Options): Boolean =
    ImageHeaderParserUtils.getType(parsers, source, arrayPool) == ImageHeaderParser.ImageType.ANIMATED_AVIF

  @Throws(IOException::class)
  override fun decode(source: InputStream, width: Int, height: Int, options: Options): Resource<FrameSeqDecoder<*, *>>? =
    decoder.decode(source, width, height, options)
}
