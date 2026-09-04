package expo.modules.image.svg

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.util.ByteBufferUtil
import com.caverock.androidsvg.SVG
import java.io.IOException
import java.nio.ByteBuffer

/**
 * Decodes an SVG that Glide holds in memory rather than as a stream. Glide falls back to the
 * in-memory data when it cannot read back what it just wrote to the disk cache, and without this
 * decoder an SVG load fails at that point while a raster one succeeds.
 */
class ByteBufferSVGDecoder(private val decoder: SVGDecoder = SVGDecoder()) : ResourceDecoder<ByteBuffer, SVG> {
  override fun handles(source: ByteBuffer, options: Options) = true

  @Throws(IOException::class)
  override fun decode(source: ByteBuffer, width: Int, height: Int, options: Options): Resource<SVG>? {
    return decoder.decode(ByteBufferUtil.toStream(source), width, height, options)
  }
}
